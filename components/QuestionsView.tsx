import { Copy, Lightbulb, MessageSquare, Plus } from "lucide-react";
import type { Item, Project } from "../lib/model";
export default function QuestionsView({
  project,
  onAdd,
  onEdit,
  onStatus,
  onCopy,
  suggestions,
  onSuggest,
}: {
  project: Project;
  onAdd: () => void;
  onEdit: (i: Item) => void;
  onStatus: (i: Item, status: NonNullable<Item["questionStatus"]>) => void;
  onCopy: (text: string) => void;
  suggestions: string[];
  onSuggest: (text: string) => void;
}) {
  const questions = project.items.filter((i) => i.section === "questions");
  const asked = new Set(questions.map((q) => q.text.toLowerCase()));
  const open = suggestions.filter((s) => !asked.has(s.toLowerCase()));
  const missing = ["budget", "timeline", "deliverables"].filter(
    (section) => !project.items.some((i) => i.section === section),
  );
  return (
    <div className="tab-content">
      <div className="view-heading">
        <div>
          <h3>Clarifications</h3>
          <p className="muted">
            Track the questions that need an answer. Messages are copied for you
            to send manually.
          </p>
        </div>
        <button className="secondary" onClick={onAdd}>
          <Plus size={16} /> Add question
        </button>
      </div>
      {missing.length > 0 && (
        <div className="inline-info">
          <MessageSquare size={18} />
          <span>
            Still missing: {missing.join(", ")}. Confirm these with your client
            before committing to delivery.
          </span>
        </div>
      )}
      {open.length > 0 && (
        <details className="suggestions">
          <summary>
            <Lightbulb size={16} /> {open.length} suggested questions for this
            project type
          </summary>
          <ul>
            {open.map((s) => (
              <li key={s}>
                <span>{s}</span>
                <button className="text-button" onClick={() => onSuggest(s)}>
                  <Plus size={14} /> Add
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      {!questions.length && (
        <div className="inline-empty">
          <MessageSquare size={24} />
          <h3>No questions recorded</h3>
          <p>
            Add your own questions or capture messages that end in a question
            mark.
          </p>
        </div>
      )}
      {questions.map((item) => (
        <article className="question-row" key={item.id}>
          <div className="source-heading">
            <span className="badge">{item.priority || "should"}</span>
            <label className="compact-label">
              Status
              <select
                aria-label={`Question status: ${item.text}`}
                value={item.questionStatus || "open"}
                onChange={(e) =>
                  onStatus(
                    item,
                    e.target.value as NonNullable<Item["questionStatus"]>,
                  )
                }
              >
                {[
                  "open",
                  "asked",
                  "answered",
                  "blocked",
                  "no longer needed",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <p>{item.text}</p>
          {item.questionUpdatedAt && (
            <p className="field-hint">
              Status changed{" "}
              {new Date(item.questionUpdatedAt).toLocaleDateString()}
            </p>
          )}
          <div className="button-row">
            <button
              className="secondary"
              onClick={() =>
                onCopy(
                  `Hi ${project.client}, could you please clarify the following?\n\n${item.text}\n\nThank you.`,
                )
              }
            >
              <Copy size={15} /> Copy clarification
            </button>
            <button className="text-button" onClick={() => onEdit(item)}>
              Edit question
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
