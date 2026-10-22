import { useState } from "react";
import Dialog from "./Dialog";
import { id, labels, sections, type Item, type Section } from "../lib/model";
export default function ItemEditor({
  item,
  section = "requirements",
  baseline,
  onClose,
  onSave,
}: {
  item?: Item;
  section?: Section;
  baseline: boolean;
  onClose: () => void;
  onSave: (item: Item) => Promise<void>;
}) {
  const [text, setText] = useState(item?.text || "");
  const [category, setCategory] = useState(item?.section || section);
  const [priority, setPriority] = useState<Item["priority"]>(
    item?.priority || "should",
  );
  const [state, setState] = useState<Item["state"]>(item?.state || "proposed");
  const [owner, setOwner] = useState(item?.owner || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog
      title={item ? "Edit brief item" : "Add brief item"}
      description={
        baseline
          ? "Your edit becomes a change proposal. The approved baseline stays unchanged."
          : "Manually entered details are labeled separately from captured evidence."
      }
      busy={busy}
      onClose={onClose}
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          try {
            await onSave({
              ...item,
              id: item?.id || id(),
              text: text.trim(),
              section: category,
              priority,
              state,
              owner,
              manual: true,
            });
            onClose();
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Details
          <textarea
            aria-label="Details"
            autoFocus
            required
            rows={5}
            maxLength={10000}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Section
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Section)}
            >
              {sections.map((s) => (
                <option value={s} key={s}>
                  {labels[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Item["priority"])}
            >
              {["must", "should", "could"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            Evidence state
            <select
              value={state}
              onChange={(e) => setState(e.target.value as Item["state"])}
            >
              {[
                "proposed",
                "confirmed",
                "ambiguous",
                "contradicted",
                "not mentioned",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Owner (optional)
            <input
              maxLength={100}
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button
            className="secondary"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="primary"
            type="submit"
            disabled={busy || !text.trim()}
          >
            {busy ? "Saving…" : baseline ? "Propose change" : "Save item"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
