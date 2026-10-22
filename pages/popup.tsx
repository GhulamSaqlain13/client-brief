import Head from "next/head";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  FileText,
  MessageSquare,
  PanelRight,
  ShieldCheck,
} from "lucide-react";
import ThemeSelect from "../components/ThemeSelect";
import { readStore, extension } from "../lib/storage";
import type { Project } from "../lib/model";

export default function Popup() {
  const [project, setProject] = useState<Project>();
  const [count, setCount] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const store = await readStore();
        if (!alive) return;
        setCount(store.projects.length);
        setProject(store.projects.filter((p) => !p.archived).at(-1));
        if (extension()) {
          const data = await chrome.storage.local.get([
            "pendingCapture",
            "captureError",
          ]);
          if (alive) {
            setPending(!!data.pendingCapture);
            if (typeof data.captureError === "string")
              setError(data.captureError);
          }
        }
      } catch {
        if (alive)
          setError("Unable to read workspace. Open the dashboard to retry.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, []);
  async function dashboard() {
    try {
      if (extension())
        await chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
      else window.open("/", "_blank", "noopener,noreferrer");
    } catch {
      setError(
        "Could not open the dashboard. Try again from the extension menu.",
      );
    }
  }
  function panel() {
    if (!extension()) {
      setError(
        "The side panel is available in the installed Chrome extension.",
      );
      return;
    }
    void chrome.windows
      .getCurrent()
      .then((w) => {
        if (w.id === undefined) throw Error("No active browser window.");
        return chrome.sidePanel.open({ windowId: w.id });
      })
      .catch(() =>
        setError(
          "Could not open the side panel. Use Open dashboard, or try Chrome’s side panel menu.",
        ),
      );
  }
  return (
    <div className="popup">
      <Head>
        <title>ClientBrief AI</title>
      </Head>
      <div className="popup-header">
        <div className="brand">
          <span className="brand-icon">
            <FileText size={21} />
          </span>
          <span>
            ClientBrief<span className="ai">AI</span>
          </span>
        </div>
      </div>
      <div className="popup-appearance">
        <ThemeSelect />
      </div>
      {loading ? (
        <p role="status" className="muted">
          Loading workspace…
        </p>
      ) : (
        <>
          <div className="popup-project">
            <h2>{project?.title || "Your next project starts here."}</h2>
            <p>
              {project
                ? `${project.client} · ${project.proposals.filter((p) => p.status === "pending").length} changes to review`
                : `${count} projects · Private local workspace`}
            </p>
            {pending && (
              <p className="field-hint">
                <MessageSquare size={14} /> A captured selection is ready to
                review.
              </p>
            )}
          </div>
          <p className="muted">
            Select conversation text on a page, right-click, and choose “Add
            selection to ClientBrief AI”.
          </p>
        </>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button className="primary wide" onClick={() => void dashboard()}>
        <ArrowUpRight size={17} />
        Open dashboard
      </button>
      <button className="secondary wide" onClick={panel}>
        <PanelRight size={17} />
        Open side panel
      </button>
      <small className="popup-footer">
        <ShieldCheck size={14} />
        Local processing · No remote AI connected
      </small>
    </div>
  );
}
