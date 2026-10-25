import {
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  Lightbulb,
  LockKeyhole,
  MessageSquareQuote,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  labels,
  sections,
  type Item,
  type Project,
  type Section,
} from "../lib/model";
export default function BriefView({
  project,
  onAdd,
  onEdit,
  onRemove,
  onReorder,
  onApprove,
  onExport,
  onSummary,
  exclusionSuggestions,
  onSuggestExclusion,
  busy,
}: {
  project: Project;
  onAdd: (s: Section) => void;
  onEdit: (i: Item) => void;
  onRemove: (i: Item) => void;
  onReorder: (i: Item, direction: number) => void;
  onApprove: () => void;
  onExport: (format: "markdown" | "json" | "csv" | "pdf") => void;
  onSummary: () => void;
  exclusionSuggestions: string[];
  onSuggestExclusion: (text: string) => void;
  busy: boolean;
}) {
  const pending = project.proposals.some((p) => p.status === "pending");
  const listed = new Set(project.items.map((i) => i.text.toLowerCase()));
  const exclusionIdeas = exclusionSuggestions.filter(
    (s) => !listed.has(s.toLowerCase()),
  );
  const speakerLabel = (item: Item) => {
    if (!item.speaker) return "";
    const role = project.sources.find((s) => s.id === item.sourceId)
      ?.speakers?.[item.speaker];
    return `${role === "me" ? "You" : role === "other" ? "Other" : "Client"} (${item.speaker})${item.sentAt ? ` · ${item.sentAt}` : ""}`;
  };
  return (
    <>
      <div className="brief-toolbar">
        <div>
          <LockKeyhole size={15} />
          {project.versions.length
            ? "Approved scope is preserved. Edits create proposals."
            : "Draft brief · Review the details before approval."}
        </div>
        <button
          className="secondary"
          onClick={onApprove}
          disabled={
            busy ||
            (!project.items.length && !project.versions.length) ||
            pending
          }
          title={
            pending ? "Review pending changes before approving" : undefined
          }
        >
          <ShieldCheck size={16} /> Approve baseline
        </button>
      </div>
      <div className="brief-grid">
        {sections.map((section) => (
          <section
            className={`brief-section ${section === "exclusions" ? "wide" : ""}`}
            key={section}
            aria-label={labels[section]}
          >
            <div className="brief-section-heading">
              <h3>{labels[section]}</h3>
              <button
                className="icon-button"
                aria-label={`Add ${labels[section]} item`}
                onClick={() => onAdd(section)}
              >
                <Plus size={18} />
              </button>
            </div>
            {!project.items.some((i) => i.section === section) && (
              <p className="unknown">
                Not mentioned
                <span>
                  {section === "exclusions"
                    ? "List what this project does not include, so the client can't assume it."
                    : "Add a conversation or enter a detail manually."}
                </span>
              </p>
            )}
            {project.items
              .filter((i) => i.section === section)
              .map((item, index, items) => (
                <article className="brief-item" key={item.id}>
                  <div className="item-top">
                    <span
                      className={`badge ${item.state === "confirmed" ? "approved" : item.state === "contradicted" ? "error-badge" : ""}`}
                    >
                      {item.state}
                    </span>
                    <div className="item-actions">
                      <button
                        className="text-button"
                        onClick={() => onEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Remove item ${index + 1} from ${labels[section]}`}
                        onClick={() => onRemove(item)}
                        disabled={busy}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p>{item.text}</p>
                  <div className="item-metadata">
                    <span title={item.id}>ID {item.id.slice(0, 8)}</span>
                    <span>{item.priority || "should"}</span>
                    {item.owner && <span>{item.owner}</span>}
                    <span>
                      {item.manual ? "Manually entered" : "Source linked"}
                    </span>
                    {item.speaker && <span>{speakerLabel(item)}</span>}
                  </div>
                  {item.excerpt && (
                    <details>
                      <summary>View evidence</summary>
                      <blockquote>{item.excerpt}</blockquote>
                      <small>
                        {new Date(
                          project.sources.find((s) => s.id === item.sourceId)
                            ?.capturedAt || project.createdAt,
                        ).toLocaleString()}
                      </small>
                    </details>
                  )}
                  {!project.versions.length && items.length > 1 && (
                    <div className="reorder-controls">
                      <button
                        className="icon-button"
                        aria-label={`Move item ${index + 1} up`}
                        disabled={index === 0 || busy}
                        onClick={() => onReorder(item, -1)}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move item ${index + 1} down`}
                        disabled={index === items.length - 1 || busy}
                        onClick={() => onReorder(item, 1)}
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  )}
                </article>
              ))}
            {section === "exclusions" && exclusionIdeas.length > 0 && (
              <div className="suggestion-chips">
                <small>
                  <Lightbulb size={13} /> Common exclusions for this project
                  type
                </small>
                {exclusionIdeas.map((s) => (
                  <button
                    key={s}
                    className="chip"
                    disabled={busy}
                    onClick={() => onSuggestExclusion(s)}
                  >
                    <Plus size={13} /> {s}
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
      <div className="export-bar">
        <span>
          <LockKeyhole size={15} /> Export the latest approved version
        </span>
        <div>
          <button
            className="secondary"
            onClick={onSummary}
            disabled={!project.versions.length}
          >
            <MessageSquareQuote size={15} /> Client summary
          </button>
          {(["markdown", "json", "csv", "pdf"] as const).map((format) => (
            <button
              key={format}
              className="secondary"
              onClick={() => onExport(format)}
              disabled={!project.versions.length}
            >
              {format === "pdf" ? (
                <FileText size={15} />
              ) : (
                <Download size={15} />
              )}
              {format === "markdown"
                ? "Markdown"
                : format === "pdf"
                  ? "Print / PDF"
                  : format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
