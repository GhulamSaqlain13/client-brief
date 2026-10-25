import type { Evidence, Project } from "../lib/model";
export default function EvidenceFields({
  project,
  value,
  onChange,
  allowManual = true,
  label = "Evidence",
}: {
  project: Project;
  value: Evidence;
  onChange: (e: Evidence) => void;
  allowManual?: boolean;
  label?: string;
}) {
  return (
    <>
      <label>
        {label}
        <select
          value={value.manual ? "" : value.sourceId || ""}
          onChange={(e) =>
            onChange(
              e.target.value
                ? { sourceId: e.target.value, excerpt: value.excerpt }
                : allowManual
                  ? { manual: true }
                  : { excerpt: value.excerpt },
            )
          }
        >
          <option value="">
            {allowManual ? "Entered manually" : "Choose a conversation"}
          </option>
          {project.sources.map((s) => (
            <option key={s.id} value={s.id}>
              Conversation from {new Date(s.capturedAt).toLocaleString()}
            </option>
          ))}
        </select>
      </label>
      {!value.manual && (
        <label>
          Exact words from that conversation
          <textarea
            rows={2}
            maxLength={2000}
            value={value.excerpt || ""}
            onChange={(e) => onChange({ ...value, excerpt: e.target.value })}
          />
        </label>
      )}
    </>
  );
}
