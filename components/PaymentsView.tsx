import { useState } from "react";
import { AlertTriangle, Plus, Wallet } from "lucide-react";
import Dialog from "./Dialog";
import EvidenceFields from "./EvidenceFields";
import { Actions, useSubmit } from "./FormActions";
import {
  formatAmount,
  id,
  type Evidence,
  type Payment,
  type Project,
} from "../lib/model";
import { paymentState, paymentTotals, today } from "../lib/planning";
export function PaymentEditor({
  project,
  value,
  defaultCurrency,
  onSave,
  onClose,
}: {
  project: Project;
  value?: Payment;
  defaultCurrency: string;
  onSave: (p: Payment) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(value?.title || "");
  const [amount, setAmount] = useState(
    value?.amount === undefined ? "" : String(value.amount),
  );
  const [currency, setCurrency] = useState(value?.currency || defaultCurrency);
  const [due, setDue] = useState(value?.due || "");
  const [status, setStatus] = useState<Payment["status"]>(
    value?.status || "due",
  );
  const [paidAt, setPaidAt] = useState(value?.paidAt || "");
  const [evidence, setEvidence] = useState<Evidence>(value || { manual: true });
  const { busy, error, submit } = useSubmit(onClose);
  return (
    <Dialog
      title={value ? "Edit payment" : "Add payment"}
      description="Record amounts exactly as the client stated them. Leave the amount empty if it was not agreed."
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(() =>
            onSave({
              id: value?.id || id(),
              ...evidence,
              title: title.trim(),
              amount: amount.trim() === "" ? undefined : Number(amount),
              currency: currency.trim().toUpperCase(),
              due,
              status,
              paidAt: status === "paid" ? paidAt || today() : undefined,
            }),
          );
        }}
      >
        <label>
          Payment name
          <input
            required
            autoFocus
            maxLength={200}
            value={title}
            placeholder="Deposit, milestone 1, final payment…"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Amount (optional)
            <input
              inputMode="decimal"
              value={amount}
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
            Due date (optional)
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Payment["status"])}
            >
              <option value="due">due</option>
              <option value="paid">paid</option>
            </select>
          </label>
          {status === "paid" && (
            <label>
              Paid on
              <input
                type="date"
                value={paidAt || today()}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </label>
          )}
        </div>
        <EvidenceFields
          project={project}
          value={evidence}
          onChange={setEvidence}
        />
        <Actions
          busy={busy}
          error={error}
          label="Save payment"
          onClose={onClose}
        />
      </form>
    </Dialog>
  );
}
export default function PaymentsView({
  project,
  onAdd,
  onEdit,
  onRemove,
}: {
  project: Project;
  onAdd: () => void;
  onEdit: (p: Payment) => void;
  onRemove: (p: Payment) => void;
}) {
  const payments = [...(project.payments || [])].sort((a, b) =>
    (a.due || "9999").localeCompare(b.due || "9999"),
  );
  const totals = Object.entries(paymentTotals(project));
  const overdue = payments.filter((p) => paymentState(p) === "overdue");
  return (
    <div className="tab-content">
      <div className="view-heading">
        <div>
          <h3>Payments</h3>
          <p className="muted">
            Track each payment the client agreed to, and see what is paid, due
            or overdue.
          </p>
        </div>
        <button className="secondary" onClick={onAdd}>
          <Plus size={16} /> Add payment
        </button>
      </div>
      {totals.length > 0 && (
        <div className="payment-totals">
          {totals.map(([currency, t]) => (
            <div key={currency}>
              <span>Paid</span>
              <strong>{formatAmount(t.paid, currency)}</strong>
              <span>Due</span>
              <strong>{formatAmount(t.due, currency)}</strong>
              <span>Overdue</span>
              <strong className={t.overdue ? "summary-warning" : ""}>
                {formatAmount(t.overdue, currency)}
              </strong>
            </div>
          ))}
        </div>
      )}
      {overdue.length > 0 && (
        <div className="inline-info warning-info" role="status">
          <AlertTriangle size={18} />
          <span>
            {overdue.length} payment{overdue.length === 1 ? " is" : "s are"}{" "}
            overdue. Consider pausing new work until payment arrives.
          </span>
        </div>
      )}
      {!payments.length && (
        <div className="inline-empty">
          <Wallet size={24} />
          <h3>No payments recorded</h3>
          <p>
            Add the deposit, milestone payments or final payment you agreed.
          </p>
        </div>
      )}
      {payments.map((p) => {
        const state = paymentState(p);
        return (
          <article className="question-row" key={p.id}>
            <div className="source-heading">
              <h3>{p.title}</h3>
              <span
                className={`badge ${state === "paid" ? "approved" : state === "overdue" ? "error-badge" : ""}`}
              >
                {state}
              </span>
            </div>
            <p>
              <strong>
                {p.amount !== undefined
                  ? formatAmount(p.amount, p.currency)
                  : "Amount unknown"}
              </strong>
              {" · "}
              {p.status === "paid"
                ? `Paid ${p.paidAt || ""}`
                : p.due
                  ? `Due ${p.due}`
                  : "Due date unknown"}
            </p>
            <p className="field-hint">
              {p.manual ? "Manually entered" : "Source linked"}
            </p>
            {p.excerpt && (
              <details>
                <summary>View evidence</summary>
                <blockquote>{p.excerpt}</blockquote>
              </details>
            )}
            <div className="button-row">
              <button className="text-button" onClick={() => onEdit(p)}>
                Edit
              </button>
              <button
                className="text-button danger"
                onClick={() => onRemove(p)}
              >
                Delete
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
