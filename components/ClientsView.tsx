import { useState } from "react";
import { ArrowRight, Building2, Plus, Users } from "lucide-react";
import Dialog from "./Dialog";
import { Actions, useSubmit } from "./FormActions";
import {
  formatAmount,
  platforms,
  type ClientRecord,
  type Store,
} from "../lib/model";
import { clientNames, clientRecord, clientStats } from "../lib/planning";
export function ClientEditor({
  value,
  isNew,
  onSave,
  onClose,
}: {
  value: ClientRecord;
  isNew: boolean;
  onSave: (c: ClientRecord) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(value.name);
  const [platform, setPlatform] = useState(value.platform || "");
  const [notes, setNotes] = useState(value.notes || "");
  const { busy, error, submit } = useSubmit(onClose);
  return (
    <Dialog
      title={isNew ? "New client" : "Edit client"}
      description="Renaming a client updates every project for that client."
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(() =>
            onSave({
              ...value,
              name: name.trim(),
              platform: platform || undefined,
              notes: notes || undefined,
            }),
          );
        }}
      >
        <label>
          Client name
          <input
            required
            autoFocus
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Usual platform
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="">Not set</option>
            {platforms.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Notes
          <textarea
            rows={4}
            maxLength={5000}
            value={notes}
            placeholder="How they like to communicate, payment habits, past issues…"
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <Actions
          busy={busy}
          error={error}
          label="Save client"
          onClose={onClose}
        />
      </form>
    </Dialog>
  );
}
export default function ClientsView({
  store,
  onNew,
  onEdit,
  onDelete,
  onProjects,
}: {
  store: Store;
  onNew: () => void;
  onEdit: (c: ClientRecord) => void;
  onDelete: (c: ClientRecord) => void;
  onProjects: (name: string) => void;
}) {
  const names = clientNames(store);
  return (
    <div className="client-list">
      <div className="view-heading">
        <p className="muted">
          History per client helps you decide how to quote repeat work.
        </p>
        <button className="secondary" onClick={onNew}>
          <Plus size={16} /> New client
        </button>
      </div>
      {!names.length && (
        <div className="inline-empty">
          <Users size={28} />
          <h2>No clients yet</h2>
          <p>Add a client, or create a project for one.</p>
        </div>
      )}
      {names.map((name) => {
        const record = clientRecord(store, name);
        const s = clientStats(store, name);
        const orders = Object.entries(s.acceptedChangeOrders);
        return (
          <article className="client-row" key={name}>
            <span className="project-icon">
              <Building2 size={20} />
            </span>
            <div>
              <h2>{name}</h2>
              <p className="muted">
                {s.projects} projects · {s.active} active · {s.completed}{" "}
                completed
                {record.platform ? ` · ${record.platform}` : ""}
              </p>
              {s.projects > 0 && (
                <p className="client-stats">
                  <span
                    className={
                      s.changesPerProject >= 2 ? "summary-warning" : ""
                    }
                  >
                    {s.scopeChanges} accepted scope additions (
                    {s.changesPerProject.toFixed(1)} per project)
                  </span>
                  <span>{s.avgRevisions.toFixed(1)} revisions per project</span>
                  {s.extraRevisions > 0 && (
                    <span className="summary-warning">
                      {s.extraRevisions} beyond agreed limits
                    </span>
                  )}
                  {orders.map(([currency, amount]) => (
                    <span key={currency}>
                      {formatAmount(amount, currency)} in accepted change orders
                    </span>
                  ))}
                  {s.overduePayments > 0 && (
                    <span className="summary-warning">
                      {s.overduePayments} overdue payments
                    </span>
                  )}
                </p>
              )}
              {record.notes && <p className="client-notes">{record.notes}</p>}
            </div>
            <div className="client-actions">
              <button className="text-button" onClick={() => onEdit(record)}>
                Edit
              </button>
              {s.projects === 0 &&
                store.clients?.some((c) => c.id === record.id) && (
                  <button
                    className="text-button danger"
                    onClick={() => onDelete(record)}
                  >
                    Delete
                  </button>
                )}
              {s.projects > 0 && (
                <button className="secondary" onClick={() => onProjects(name)}>
                  View projects
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
