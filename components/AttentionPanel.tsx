import {
  AlarmClock,
  CalendarClock,
  GitCompareArrows,
  Hourglass,
} from "lucide-react";
import type { Attention } from "../lib/planning";
const icons = {
  overdue: AlarmClock,
  soon: CalendarClock,
  waiting: Hourglass,
  review: GitCompareArrows,
};
const titles = {
  overdue: "Overdue",
  soon: "Due this week",
  waiting: "Waiting",
  review: "To review",
};
export default function AttentionPanel({
  items,
  onOpen,
}: {
  items: Attention[];
  onOpen: (projectId: string) => void;
}) {
  if (!items.length) return null;
  const shown = items.slice(0, 8);
  return (
    <section className="attention-panel" aria-labelledby="attention-title">
      <div className="attention-heading">
        <h2 id="attention-title">Needs your attention</h2>
        <span>
          {(["overdue", "soon", "waiting", "review"] as const)
            .map((kind) => [kind, items.filter((i) => i.kind === kind).length])
            .filter(([, n]) => n)
            .map(
              ([kind, n]) =>
                `${n} ${titles[kind as keyof typeof titles].toLowerCase()}`,
            )
            .join(" · ")}
        </span>
      </div>
      <ul>
        {shown.map((item, i) => {
          const Icon = icons[item.kind];
          return (
            <li
              key={`${item.projectId}-${i}`}
              className={`attention-${item.kind}`}
            >
              <Icon size={16} />
              <button
                className="text-button"
                onClick={() => onOpen(item.projectId)}
              >
                {item.label}
              </button>
              <small>
                {item.project}
                {item.date ? ` · ${item.date}` : ""}
              </small>
            </li>
          );
        })}
      </ul>
      {items.length > shown.length && (
        <p className="field-hint">
          and {items.length - shown.length} more. Open a project to see all.
        </p>
      )}
    </section>
  );
}
