import { useState } from "react";
import { Copy, ShieldCheck } from "lucide-react";
import Dialog from "./Dialog";
import EvidenceFields from "./EvidenceFields";
import {
  id,
  type Confirmation,
  type Evidence,
  type Project,
} from "../lib/model";
import { clientSummary } from "../lib/planning";
export default function ClientSummaryDialog({
  project,
  onCopy,
  onConfirm,
  onClose,
}: {
  project: Project;
  onCopy: (text: string) => void;
  onConfirm: (c: Confirmation) => Promise<void>;
  onClose: () => void;
}) {
  const version = project.versions.at(-1)!;
  const [text, setText] = useState(() => clientSummary(project));
  const [evidence, setEvidence] = useState<Evidence>({
    sourceId: project.sources.at(-1)?.id,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirmed = (project.confirmations || []).filter(
    (c) => c.version === version.number,
  );
  return (
    <Dialog
      title="Confirm scope with your client"
      description={`Built from approved brief v${version.number}. Edit if needed, copy it, and send it through your usual channel. Nothing is sent for you.`}
      onClose={onClose}
      busy={busy}
    >
      <label>
        Summary for the client
        <textarea
          rows={14}
          maxLength={20000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <div className="button-row">
        <button
          className="primary"
          disabled={!text.trim()}
          onClick={() => onCopy(text)}
        >
          <Copy size={15} /> Copy summary
        </button>
        <button
          className="text-button"
          onClick={() => setText(clientSummary(project))}
        >
          Reset to approved scope
        </button>
      </div>
      <form
        className="confirmation-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onConfirm({
              id: id(),
              version: version.number,
              sourceId: evidence.sourceId || "",
              excerpt: evidence.excerpt || "",
              recordedAt: new Date().toISOString(),
            });
            onClose();
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h3>Record the client&apos;s confirmation</h3>
        {confirmed.length > 0 && (
          <p className="field-hint">
            <ShieldCheck size={14} /> Already confirmed{" "}
            {new Date(confirmed.at(-1)!.recordedAt).toLocaleDateString()}
          </p>
        )}
        <p className="muted">
          When the client replies, add their reply as a conversation first, then
          quote their exact words here.
        </p>
        {project.sources.length ? (
          <>
            <EvidenceFields
              project={project}
              value={evidence}
              allowManual={false}
              label="Client's reply"
              onChange={setEvidence}
            />
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-actions">
              <button
                className="secondary"
                disabled={busy || !evidence.sourceId || !evidence.excerpt}
              >
                {busy ? "Saving…" : "Record confirmation"}
              </button>
            </div>
          </>
        ) : (
          <p className="field-hint">No conversations captured yet.</p>
        )}
      </form>
    </Dialog>
  );
}
