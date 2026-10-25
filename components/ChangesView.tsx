import { useState } from "react";
import { Check, FileSignature, GitCompareArrows } from "lucide-react";
import {
  formatAmount,
  labels,
  type Project,
  type Proposal,
} from "../lib/model";
const billableCategories = ["new feature", "scope expansion"];
const categories = [
  "new feature",
  "scope expansion",
  "scope reduction",
  "deadline change",
  "budget change",
  "clarification",
  "contradiction",
  "duplicate",
  "unrelated",
];
function Change({
  proposal,
  busy,
  onReview,
  onChangeOrder,
}: {
  proposal: Proposal;
  busy: boolean;
  onChangeOrder: (p: Proposal) => void;
  onReview: (
    p: Proposal,
    action: "accept" | "reject" | "replace",
    category: string,
    reason: string,
  ) => void;
}) {
  const [category, setCategory] = useState(
    proposal.category || "clarification",
  );
  const [reason, setReason] = useState("");
  return (
    <article className="change-row">
      <div className="source-heading">
        <div>
          <strong>{labels[proposal.item.section]}</strong>
          <p className="field-hint">
            {proposal.operation === "remove"
              ? "Proposed removal"
              : "Proposed change"}{" "}
            · {proposal.item.manual ? "Manually entered" : "Source linked"}
          </p>
        </div>
        <span
          className={`badge ${proposal.status === "accepted" ? "approved" : ""}`}
        >
          {proposal.status}
        </span>
      </div>
      <div className="diff">
        <div>
          <small>Previous scope</small>
          <p>{proposal.before}</p>
        </div>
        <div>
          <small>
            {proposal.operation === "remove"
              ? "Remove this item"
              : "Proposed item"}
          </small>
          <p>{proposal.item.text}</p>
          {proposal.item.excerpt && (
            <details>
              <summary>View evidence</summary>
              <blockquote>{proposal.item.excerpt}</blockquote>
            </details>
          )}
        </div>
      </div>
      {proposal.hint && proposal.status === "pending" && (
        <p className="field-hint">
          Rule-based hint: {proposal.hint} Suggested classification:{" "}
          {proposal.category}.
        </p>
      )}
      {proposal.operation !== "remove" &&
        (billableCategories.includes(category) || proposal.changeOrder) && (
          <div className="change-order">
            <FileSignature size={18} />
            <span>
              {proposal.changeOrder
                ? `Change order ${proposal.changeOrder.status}${proposal.changeOrder.amount !== undefined ? ` · ${formatAmount(proposal.changeOrder.amount, proposal.changeOrder.currency)}` : ""}${proposal.changeOrder.extraDays !== undefined ? ` · +${proposal.changeOrder.extraDays} days` : ""}`
                : proposal.status === "pending"
                  ? "This adds work beyond the approved scope. Agree on price and time with the client before accepting it."
                  : "No change order was recorded for this extra work."}
            </span>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => onChangeOrder(proposal)}
            >
              {proposal.changeOrder
                ? "Edit change order"
                : "Draft change order"}
            </button>
          </div>
        )}
      {proposal.status === "pending" ? (
        <>
          <div className="form-grid">
            <label>
              Classification
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Review reason (optional)
              <input
                maxLength={2000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why this change is needed"
              />
            </label>
          </div>
          <div className="button-row">
            <button
              className="primary"
              disabled={busy}
              onClick={() => onReview(proposal, "accept", category, reason)}
            >
              <Check size={16} />{" "}
              {proposal.operation === "remove"
                ? "Accept removal"
                : "Accept into draft"}
            </button>
            {proposal.operation !== "remove" && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => onReview(proposal, "replace", category, reason)}
              >
                Replace section
              </button>
            )}
            <button
              className="secondary"
              disabled={busy}
              onClick={() => onReview(proposal, "reject", category, reason)}
            >
              Reject
            </button>
          </div>
        </>
      ) : (
        <p className="field-hint">
          {proposal.category || "Unclassified"} · Reviewed{" "}
          {proposal.reviewedAt
            ? new Date(proposal.reviewedAt).toLocaleString()
            : "in an earlier session"}
          {proposal.reason && ` · ${proposal.reason}`}
        </p>
      )}
    </article>
  );
}
export default function ChangesView({
  project,
  busy,
  onReview,
  onChangeOrder,
}: {
  project: Project;
  busy: boolean;
  onChangeOrder: (p: Proposal) => void;
  onReview: (
    p: Proposal,
    action: "accept" | "reject" | "replace",
    category: string,
    reason: string,
  ) => void;
}) {
  const [filter, setFilter] = useState("pending");
  const filtered = project.proposals.filter(
    (p) => filter === "all" || p.status === filter,
  );
  return (
    <div className="tab-content">
      <div className="view-heading">
        <div>
          <h3>Scope review</h3>
          <p className="muted">
            Classify each change, then accept or reject it. Accepted changes
            stay in a draft until you approve a baseline.
          </p>
        </div>
        <label className="compact-label">
          Show
          <select
            aria-label="Filter changes"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["pending", "accepted", "rejected", "all"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="inline-info">
        <GitCompareArrows size={18} />
        <span>
          Local comparison identifies new text, not semantic contradictions.
          Classification is your decision. Accepting adds the item; replacing a
          section removes all current items in that section from the working
          draft.
        </span>
      </div>
      {!filtered.length && (
        <div className="inline-empty">
          <Check size={24} />
          <h3>
            {filter === "pending"
              ? "No changes waiting for review"
              : "No changes in this view"}
          </h3>
          <p>
            Add a new conversation after approving a baseline to compare scope.
          </p>
        </div>
      )}
      {filtered.map((p) => (
        <Change
          key={p.id}
          proposal={p}
          busy={busy}
          onReview={onReview}
          onChangeOrder={onChangeOrder}
        />
      ))}
    </div>
  );
}
