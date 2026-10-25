import { useState } from "react";
import { Copy } from "lucide-react";
import Dialog from "./Dialog";
import {
  changeOrderMessage,
  checkChangeOrder,
  type ChangeOrder,
} from "../lib/model";
const statuses: ChangeOrder["status"][] = [
  "draft",
  "sent",
  "accepted by client",
  "declined by client",
];
export default function ChangeOrderDialog({
  kind,
  client,
  request,
  version,
  limit,
  value,
  defaultCurrency,
  onSave,
  onCopy,
  onClose,
}: {
  kind: "scope" | "revision";
  client: string;
  request: string;
  version?: number;
  limit?: number;
  value?: ChangeOrder;
  defaultCurrency: string;
  onSave: (order: ChangeOrder) => Promise<void>;
  onCopy: (text: string) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(
    value?.amount === undefined ? "" : String(value.amount),
  );
  const [currency, setCurrency] = useState(value?.currency || defaultCurrency);
  const [extraDays, setExtraDays] = useState(
    value?.extraDays === undefined ? "" : String(value.extraDays),
  );
  const [tone, setTone] = useState<"concise" | "detailed">("concise");
  const [status, setStatus] = useState<ChangeOrder["status"]>(
    value?.status || "draft",
  );
  const [message, setMessage] = useState(value?.message || "");
  // Regenerate the draft from the fields until the user edits it by hand.
  const [edited, setEdited] = useState(!!value);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const order = (): ChangeOrder => ({
    amount: amount.trim() === "" ? undefined : Number(amount),
    currency: currency.trim().toUpperCase(),
    extraDays: extraDays.trim() === "" ? undefined : Number(extraDays),
    message,
    status,
    updatedAt: new Date().toISOString(),
  });
  const text = edited
    ? message
    : changeOrderMessage({
        client,
        kind,
        request,
        version,
        limit,
        amount:
          amount.trim() === "" || !Number.isFinite(Number(amount))
            ? undefined
            : Number(amount),
        currency: currency.trim().toUpperCase(),
        extraDays:
          extraDays.trim() === "" || !Number.isSafeInteger(Number(extraDays))
            ? undefined
            : Number(extraDays),
        tone,
      });
  return (
    <Dialog
      title={kind === "revision" ? "Extra revision request" : "Change order"}
      description="Enter the price and time impact yourself. Nothing is estimated or sent for you: copy the message and send it through your usual client channel."
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const result = { ...order(), message: text };
            checkChangeOrder(result);
            await onSave(result);
            onClose();
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <blockquote className="change-order-request">{request}</blockquote>
        <div className="form-grid">
          <label>
            Additional price (optional)
            <input
              inputMode="decimal"
              value={amount}
              placeholder="Leave empty to confirm later"
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            Currency
            <input
              maxLength={3}
              value={currency}
              placeholder="USD"
              onChange={(e) => setCurrency(e.target.value)}
            />
          </label>
          <label>
            Extra working days (optional)
            <input
              inputMode="numeric"
              value={extraDays}
              onChange={(e) => setExtraDays(e.target.value)}
            />
          </label>
          <label>
            Tone
            <select
              value={tone}
              onChange={(e) =>
                setTone(e.target.value as "concise" | "detailed")
              }
            >
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
            </select>
          </label>
        </div>
        <label>
          Message to client
          <textarea
            rows={9}
            maxLength={5000}
            value={text}
            onChange={(e) => {
              setEdited(true);
              setMessage(e.target.value);
            }}
          />
        </label>
        {edited && (
          <button
            type="button"
            className="text-button"
            onClick={() => setEdited(false)}
          >
            Rebuild message from the fields above
          </button>
        )}
        <label>
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ChangeOrder["status"])}
          >
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="secondary"
            disabled={busy || !text.trim()}
            onClick={() => onCopy(text)}
          >
            <Copy size={15} /> Copy message
          </button>
          <button className="primary" disabled={busy || !text.trim()}>
            {busy ? "Saving…" : "Save change order"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
