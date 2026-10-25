import Head from "next/head";
import { useEffect, useState } from "react";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Folder,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  Upload,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import ThemeSelect from "../components/ThemeSelect";
import ProjectForm from "../components/ProjectForm";
import CaptureDialog, {
  type PendingCapture,
} from "../components/CaptureDialog";
import ItemEditor from "../components/ItemEditor";
import SettingsDialog from "../components/SettingsDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import BriefView from "../components/BriefView";
import ChangesView from "../components/ChangesView";
import QuestionsView from "../components/QuestionsView";
import MilestoneEditor from "../components/MilestoneEditor";
import ChangeOrderDialog from "../components/ChangeOrderDialog";
import RevisionsView from "../components/RevisionsView";
import RevisionEditor, {
  RevisionPolicyEditor,
} from "../components/RevisionEditor";
import ChecklistView from "../components/ChecklistView";
import PaymentsView, { PaymentEditor } from "../components/PaymentsView";
import ClientSummaryDialog from "../components/ClientSummaryDialog";
import ClientsView, { ClientEditor } from "../components/ClientsView";
import AttentionPanel from "../components/AttentionPanel";
import {
  applyTemplate,
  attention,
  clientNames,
  deleteClient,
  readiness,
  recordConfirmation,
  saveChecklistItem,
  saveClient,
  savePayment,
} from "../lib/planning";
import { templates } from "../lib/templates";
import { splitThread } from "../lib/conversation";
import {
  EmptyIllustration,
  HeroIllustration,
  StepIllustration,
} from "../components/Illustrations";
import { useWorkspace } from "../hooks/useWorkspace";
import {
  addCapture,
  approve,
  contentHash,
  csv,
  editItem,
  emptyStore,
  id,
  labels,
  markdown,
  platforms,
  removeCapture,
  reviewProposal,
  revisionUsage,
  saveRevision,
  setChangeOrder,
  setRevisionPolicy,
  type ClientRecord,
  type Item,
  type Milestone,
  type Payment,
  type Project,
  type Proposal,
  type Revision,
  type Section,
} from "../lib/model";
import { copy, download, fileName } from "../lib/files";
import { extension, rawWorkspace, resetInvalidWorkspace } from "../lib/storage";

type Tab =
  | "brief"
  | "sources"
  | "changes"
  | "questions"
  | "checklist"
  | "revisions"
  | "milestones"
  | "payments"
  | "history";
type Modal =
  | "create"
  | "edit-project"
  | "capture"
  | "settings"
  | "item"
  | "milestone"
  | "revision"
  | "revision-policy"
  | "change-order"
  | "payment"
  | "client"
  | "summary"
  | null;
type Confirmation = {
  title: string;
  description: string;
  label: string;
  danger?: boolean;
  action: () => Promise<void>;
};
const tabs: { id: Tab; label: string }[] = [
  { id: "brief", label: "Project brief" },
  { id: "sources", label: "Sources" },
  { id: "changes", label: "Changes" },
  { id: "questions", label: "Questions" },
  { id: "checklist", label: "Checklist" },
  { id: "revisions", label: "Revisions" },
  { id: "milestones", label: "Milestones" },
  { id: "payments", label: "Payments" },
  { id: "history", label: "Version history" },
];
const date = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
function status(project: Project) {
  return project.archived
    ? "Archived"
    : project.status && project.status !== "new"
      ? project.status
      : project.versions.length
        ? "Approved baseline"
        : "Draft";
}

export default function Dashboard() {
  const { store, ready, error, load, commit, updateProject } = useWorkspace();
  const [snapshot, setSnapshot] = useState<Project>();
  const [selected, setSelected] = useState("");
  const [view, setView] = useState<"projects" | "clients">("projects");
  const [tab, setTab] = useState<Tab>("brief");
  const [search, setSearch] = useState("");
  const [archive, setArchive] = useState("active");
  const [platform, setPlatform] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [pending, setPending] = useState<PendingCapture | null>(null);
  const [edit, setEdit] = useState<Item | undefined>();
  const [section, setSection] = useState<Section>("requirements");
  const [milestone, setMilestone] = useState<Milestone | undefined>();
  const [revision, setRevision] = useState<Revision | undefined>();
  const [payment, setPayment] = useState<Payment | undefined>();
  const [clientEdit, setClientEdit] = useState<{
    record: ClientRecord;
    isNew: boolean;
  }>();
  const [orderFor, setOrderFor] = useState<
    | { kind: "scope"; proposal: Proposal }
    | { kind: "revision"; revision: Revision }
  >();
  const [importNext, setImportNext] = useState(false);
  const [captureFor, setCaptureFor] = useState("");
  const project = store.projects.find((p) => p.id === selected);
  const clients = clientNames(store);
  const alerts = attention(store);
  const template = project?.template ? templates[project.template] : undefined;
  // Template suggestions become manual items; after approval they are proposals.
  function addSuggested(section: Section, text: string) {
    if (!project) return;
    void run(
      async () => {
        await updateProject(project, (p) =>
          editItem(p, {
            id: id(),
            section,
            text,
            state: "proposed",
            manual: true,
            priority: "should",
          }),
        );
      },
      project.versions.length
        ? "Suggestion proposed. Review it in Changes."
        : "Suggestion added to the brief.",
    );
  }
  const active = store.projects.filter((p) => !p.archived);
  const changes = active.reduce(
    (n, p) => n + p.proposals.filter((c) => c.status === "pending").length,
    0,
  );
  const approvedCount = active.filter((p) => p.versions.length).length;
  const gettingStarted = [
    { label: "Add your first client", done: store.projects.length > 0 },
    {
      label: "Paste a conversation",
      done: store.projects.some((p) => p.sources.length),
    },
    {
      label: "Approve your first brief",
      done: store.projects.some((p) => p.versions.length),
    },
  ];
  const stepsDone = gettingStarted.filter((s) => s.done).length;
  const pendingCount =
    project?.proposals.filter((p) => p.status === "pending").length || 0;
  function notify(text: string, isError = false) {
    setNotice({ text, error: isError });
  }
  async function run(action: () => Promise<void>, message?: string) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      if (message) notify(message);
    } catch (error) {
      notify((error as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  function openProject(p: Project) {
    setSelected(p.id);
    setView("projects");
    setTab("brief");
    try {
      sessionStorage.setItem("clientbrief-project", p.id);
    } catch {
      /* Navigation still works without session storage. */
    }
  }
  function allProjects() {
    setSelected("");
    setView("projects");
    try {
      sessionStorage.removeItem("clientbrief-project");
    } catch {
      /* Optional navigation preference. */
    }
  }
  useEffect(() => {
    if (ready) {
      try {
        const last = sessionStorage.getItem("clientbrief-project");
        if (last) setSelected(last);
      } catch {
        /* No saved navigation. */
      }
    }
  }, [ready]);
  useEffect(() => {
    if (!extension()) return;
    const receive = (value: unknown) => {
      if (
        value &&
        typeof value === "object" &&
        "text" in value &&
        "url" in value &&
        "capturedAt" in value
      ) {
        const v = value as PendingCapture;
        if (
          typeof v.text === "string" &&
          typeof v.url === "string" &&
          typeof v.capturedAt === "string"
        )
          setPending(v);
      } else setPending(null);
    };
    chrome.storage.local
      .get("pendingCapture")
      .then((v) => receive(v.pendingCapture))
      .catch(() =>
        notify(
          "Could not read the pending selection. Re-select the text and try again.",
          true,
        ),
      );
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === "local" && changes.pendingCapture)
        receive(changes.pendingCapture.newValue);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);
  function ask(
    title: string,
    description: string,
    label: string,
    action: () => Promise<void>,
    danger = false,
  ) {
    setConfirmation({ title, description, label, action, danger });
  }
  function addItem(value: Section) {
    setSnapshot(project);
    setEdit(undefined);
    setSection(value);
    setModal("item");
  }
  function editExisting(item: Item) {
    setSnapshot(project);
    setEdit(item);
    setSection(item.section);
    setModal("item");
  }
  // Import starts a new project, then opens capture where files can be imported.
  function importTranscript() {
    setImportNext(true);
    setModal("create");
  }
  useEffect(() => {
    if (captureFor && project?.id === captureFor && !modal) {
      setCaptureFor("");
      setModal("capture");
    }
  }, [captureFor, project, modal]);
  function capture() {
    if (!project) {
      notify("Open or create a project, then review the selection.");
      return;
    }
    setModal("capture");
  }
  function exportBrief(format: "markdown" | "json" | "csv" | "pdf") {
    if (!project) return;
    void run(async () => {
      const baseline = project.versions.at(-1);
      if (!baseline) throw Error("Approve a baseline before exporting.");
      if (format === "pdf") {
        window.open(
          `${extension() ? "/print/index.html" : "/print/"}?project=${encodeURIComponent(project.id)}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
      const name = `${fileName(project.title)}-v${baseline.number}`;
      if (format === "markdown") download(`${name}.md`, markdown(project));
      else if (format === "csv")
        download(`${name}.csv`, csv(project), "text/csv");
      else
        download(
          `${name}.json`,
          JSON.stringify(
            {
              title: project.title,
              client: project.client,
              version: baseline,
              exportedAt: new Date().toISOString(),
              evidence: baseline.items
                .filter((i) => i.sourceId)
                .map((i) => ({
                  itemId: i.id,
                  sourceId: i.sourceId,
                  excerpt: i.excerpt,
                  capturedAt: project.sources.find((s) => s.id === i.sourceId)
                    ?.capturedAt,
                })),
            },
            null,
            2,
          ),
          "application/json",
        );
    });
  }
  function review(
    proposal: Proposal,
    action: "accept" | "reject" | "replace",
    category: string,
    reason: string,
  ) {
    if (!project) return;
    const execute = async () => {
      await updateProject(project, (p) =>
        reviewProposal(p, proposal.id, action, category, reason),
      );
      notify(
        action === "reject"
          ? "Change rejected."
          : "Change accepted into the draft. Approve a new baseline when ready.",
      );
    };
    if (action === "replace")
      ask(
        "Replace this section?",
        `All working items in ${labels[proposal.item.section].toLowerCase()} will be replaced by this proposal. Earlier approved versions stay unchanged.`,
        "Replace section",
        execute,
      );
    else void run(execute);
  }
  function openChangeOrder(
    target:
      | { kind: "scope"; proposal: Proposal }
      | { kind: "revision"; revision: Revision },
  ) {
    setSnapshot(project);
    setOrderFor(target);
    setModal("change-order");
  }
  const filtered = store.projects
    .filter((p) => {
      const haystack = [
        p.title,
        p.client,
        p.platform,
        p.tags,
        p.notes,
        ...p.items.map((i) => i.text),
        ...p.sources.map((s) => s.text),
        ...(p.milestones || []).map((m) => m.title),
      ]
        .join(" ")
        .toLowerCase();
      return (
        (archive === "all" ||
          (archive === "archived" ? p.archived : !p.archived)) &&
        (platform === "all" || p.platform === platform) &&
        (statusFilter === "all" ||
          (statusFilter === "approved"
            ? p.versions.length > 0
            : (p.status || "new") === statusFilter)) &&
        haystack.includes(search.toLowerCase())
      );
    })
    .sort((a, b) =>
      sort === "name"
        ? a.title.localeCompare(b.title)
        : b.createdAt.localeCompare(a.createdAt),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * 8, currentPage * 8 + 8);
  const showLibrary = !project;

  return (
    <>
      <Head>
        <title>ClientBrief AI · Project workspace</title>
        <meta
          name="description"
          content="Capture conversations, review requirements, and keep scope under control."
        />
      </Head>
      <div className="app-shell">
        <aside className="sidebar">
          <button
            type="button"
            onClick={allProjects}
            className="brand"
            aria-label="ClientBrief workspace"
          >
            <span className="brand-icon">
              <FileText size={22} />
            </span>
            <span>
              ClientBrief<span className="ai">AI</span>
            </span>
          </button>
          <div className="workspace">
            <span className="avatar">
              <Building2 size={18} />
            </span>
            <div>
              Personal workspace<small>Private · Stored on this device</small>
            </div>
          </div>
          <div className="nav-label">Workspace</div>
          <nav aria-label="Workspace navigation">
            <button
              className={`nav-item ${view === "projects" ? "active" : ""}`}
              onClick={allProjects}
            >
              <LayoutDashboard size={18} />
              Projects<span>{active.length}</span>
            </button>
            <button
              className={`nav-item ${view === "clients" ? "active" : ""}`}
              onClick={() => {
                setSelected("");
                setView("clients");
              }}
            >
              <Users size={18} />
              Clients<span>{clients.length}</span>
            </button>
            <button className="nav-item" onClick={() => setModal("settings")}>
              <Settings size={18} />
              Settings & privacy
            </button>
          </nav>
          <div className="nav-label projects-label">
            Recent projects
            <button
              aria-label="New project"
              onClick={() => setModal("create")}
              disabled={!ready}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="project-list">
            {active
              .slice(-6)
              .reverse()
              .map((p) => (
                <button
                  className={`project-link ${selected === p.id ? "selected" : ""}`}
                  key={p.id}
                  onClick={() => openProject(p)}
                >
                  <Folder size={16} />
                  <span>
                    {p.title}
                    <small>{p.client}</small>
                  </span>
                </button>
              ))}
            {ready && !active.length && (
              <div className="sidebar-empty">
                <span className="recent-placeholder" aria-hidden="true">
                  <i />
                  <b />
                </span>
                <span className="recent-placeholder short" aria-hidden="true">
                  <i />
                  <b />
                </span>
                <p>Projects you open show up here.</p>
              </div>
            )}
          </div>
          {ready && stepsDone < gettingStarted.length && (
            <section
              className="getting-started"
              aria-label="Getting started progress"
            >
              <svg viewBox="0 0 140 140" aria-hidden="true">
                <circle cx="70" cy="70" r="64" />
                <circle cx="70" cy="70" r="44" />
                <circle className="core" cx="70" cy="70" r="24" />
                <circle className="spark" cx="114" cy="40" r="4" />
              </svg>
              <div>
                <small>Getting started</small>
                <strong>
                  {stepsDone} of {gettingStarted.length} steps done
                </strong>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={gettingStarted.length}
                aria-valuenow={stepsDone}
                aria-label="Setup progress"
              >
                <span
                  style={{
                    width: `${Math.max(6, (stepsDone / gettingStarted.length) * 100)}%`,
                  }}
                />
              </div>
              <ul>
                {gettingStarted.map((s) => (
                  <li key={s.label} className={s.done ? "done" : ""}>
                    <span>{s.done && <Check size={11} strokeWidth={3} />}</span>
                    {s.label}
                    {s.done && <span className="visually-hidden"> (done)</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="sidebar-bottom">
            <div className="privacy-note">
              <ShieldCheck size={19} />
              <div>
                Local by choice<small>No remote AI or cloud sync.</small>
              </div>
            </div>
            <button
              className="nav-item user-settings"
              onClick={() => setModal("settings")}
            >
              <Settings size={18} />
              Workspace settings
            </button>
          </div>
        </aside>
        <main>
          <header className="topbar">
            <div className="breadcrumb">
              <button className="text-button" onClick={allProjects}>
                Workspace
              </button>
              <ChevronRight size={14} />
              <span>{view === "clients" ? "Clients" : "Projects"}</span>
            </div>
            <div className="top-actions">
              <ThemeSelect />
              <span className="local-indicator">
                <span className="local-dot" />
                Local mode
              </span>
              <button
                className="icon-button"
                aria-label="Privacy settings"
                onClick={() => setModal("settings")}
              >
                <ShieldCheck size={18} />
              </button>
            </div>
          </header>
          <nav
            className="mobile-workspace-nav"
            aria-label="Compact workspace navigation"
          >
            <button
              className={view === "projects" ? "active" : ""}
              onClick={allProjects}
            >
              <LayoutDashboard size={16} />
              Projects
            </button>
            <button
              className={view === "clients" ? "active" : ""}
              onClick={() => {
                setSelected("");
                setView("clients");
              }}
            >
              <Users size={16} />
              Clients
            </button>
          </nav>
          <div className="main-content">
            {notice && (
              <div
                role={notice.error ? "alert" : "status"}
                className={`notice ${notice.error ? "notice-error" : ""}`}
              >
                <span>{notice.text}</span>
                <button
                  className="icon-button"
                  aria-label="Dismiss notice"
                  onClick={() => setNotice(null)}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {error && (
              <div role="alert" className="load-error">
                <h2>Workspace could not be loaded</h2>
                <p>{error}</p>
                <p>Your stored data has not been changed.</p>
                <button className="secondary" onClick={() => void load()}>
                  Retry loading workspace
                </button>
                <div className="button-row">
                  <button
                    className="secondary"
                    onClick={() =>
                      void run(async () =>
                        download(
                          "clientbrief-recovery.json",
                          await rawWorkspace(),
                          "application/json",
                        ),
                      )
                    }
                  >
                    Export recovery data
                  </button>
                  {!ready && (
                    <button
                      className="secondary danger"
                      onClick={() =>
                        ask(
                          "Reset unreadable workspace?",
                          "Export recovery data first if you want to keep the original stored content. This permanently clears the unreadable local data and starts an empty workspace.",
                          "Reset workspace",
                          async () => {
                            await resetInvalidWorkspace();
                            await load();
                            allProjects();
                          },
                          true,
                        )
                      }
                    >
                      Reset unreadable workspace
                    </button>
                  )}
                </div>
              </div>
            )}
            {showLibrary && view === "projects" ? (
              <section className="hero" aria-labelledby="projects-title">
                <div className="hero-copy">
                  <span className="hero-pill">
                    <Sparkles size={14} />
                    Conversation → scope, on your device
                  </span>
                  <h1 id="projects-title">Projects</h1>
                  <p>
                    Turn conversations into scope you can confidently work from.
                  </p>
                  <div className="hero-actions">
                    <button
                      className="primary large"
                      onClick={() => setModal("create")}
                      disabled={!ready}
                    >
                      <Plus size={18} strokeWidth={2.2} />
                      New project
                    </button>
                    <button
                      className="secondary large"
                      onClick={importTranscript}
                      disabled={!ready}
                    >
                      <Upload size={18} />
                      Import transcript
                    </button>
                  </div>
                </div>
                <HeroIllustration />
              </section>
            ) : (
              <div className="page-heading">
                {project && (
                  <button
                    className="text-button back-link"
                    onClick={allProjects}
                  >
                    <ArrowLeft size={16} />
                    All projects
                  </button>
                )}
                <div className="heading-row">
                  <div>
                    <h1>
                      {project
                        ? project.title
                        : view === "clients"
                          ? "Clients"
                          : "Projects"}
                    </h1>
                    <p>
                      {project
                        ? `${project.client} · ${project.platform}`
                        : view === "clients"
                          ? "A clear view of who you work with."
                          : "Turn conversations into scope you can confidently work from."}
                    </p>
                  </div>
                  <div className="heading-actions">
                    {project ? (
                      <>
                        <button
                          className="secondary"
                          onClick={() => {
                            setSnapshot(project);
                            setModal("edit-project");
                          }}
                        >
                          <Settings size={16} />
                          Project settings
                        </button>
                        <button className="primary" onClick={capture}>
                          <Plus size={17} />
                          Add conversation
                        </button>
                      </>
                    ) : (
                      <button
                        className="primary"
                        onClick={() => setModal("create")}
                        disabled={!ready}
                      >
                        <Plus size={17} />
                        New project
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {pending && (
              <div className="capture-banner">
                <MessageSquare size={20} />
                <div>
                  <strong>A selection is ready to review</strong>
                  <small>
                    {project
                      ? "Preview the text before saving it to this project."
                      : "Open a project below to attach the selection."}
                  </small>
                </div>
                {project && (
                  <button className="secondary" onClick={capture}>
                    Review capture
                    <ArrowRight size={15} />
                  </button>
                )}
                <button
                  className="icon-button"
                  aria-label="Discard pending selection"
                  onClick={() =>
                    void run(async () => {
                      if (extension())
                        await chrome.storage.local.remove("pendingCapture");
                      setPending(null);
                    })
                  }
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {!ready && !error ? (
              <div className="inline-empty" role="status">
                <span className="loading-indicator" />
                <p>Loading your workspace…</p>
              </div>
            ) : (
              ready && (
                <>
                  {showLibrary && (
                    <div className="workspace-metrics">
                      {[
                        {
                          tone: "accent",
                          Icon: Folder,
                          value: active.length,
                          label: "Active projects",
                        },
                        {
                          tone: "success",
                          Icon: ShieldCheck,
                          value: approvedCount,
                          label: "Approved briefs",
                        },
                        {
                          tone: "warning",
                          Icon: MessageSquare,
                          value: changes,
                          label: "Changes to review",
                        },
                      ].map(({ tone, Icon, value, label }) => (
                        <div className={`metric metric-${tone}`} key={label}>
                          <span className="metric-icon">
                            <Icon size={22} />
                          </span>
                          <div>
                            <strong>{value}</strong>
                            <span>{label}</span>
                          </div>
                          <svg viewBox="0 0 72 36" aria-hidden="true">
                            <path d="M2 30 H70" />
                            <circle cx="70" cy="30" r="3.5" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  )}
                  {showLibrary && view === "projects" && (
                    <AttentionPanel
                      items={alerts}
                      onOpen={(projectId) => {
                        const target = store.projects.find(
                          (p) => p.id === projectId,
                        );
                        if (target) openProject(target);
                      }}
                    />
                  )}
                  {showLibrary && view === "clients" ? (
                    <ClientsView
                      store={store}
                      onNew={() => {
                        setModal("client");
                        setClientEdit({
                          record: {
                            id: id(),
                            name: "",
                            createdAt: new Date().toISOString(),
                          },
                          isNew: true,
                        });
                      }}
                      onEdit={(record) => {
                        setClientEdit({ record, isNew: false });
                        setModal("client");
                      }}
                      onDelete={(record) =>
                        ask(
                          "Delete client?",
                          `Remove the client record for ${record.name}. This client has no projects.`,
                          "Delete client",
                          async () => {
                            await commit((s) => deleteClient(s, record.id));
                            notify("Client deleted.");
                          },
                          true,
                        )
                      }
                      onProjects={(name) => {
                        setView("projects");
                        setArchive("all");
                        setSearch(name);
                        setPage(0);
                      }}
                    />
                  ) : showLibrary ? (
                    <>
                      <div className="library-toolbar">
                        <label className="search-field">
                          Search
                          <span className="search">
                            <Search size={18} />
                            <input
                              type="search"
                              aria-label="Search projects"
                              value={search}
                              placeholder="Search projects, clients, or scope…"
                              onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                              }}
                            />
                          </span>
                        </label>
                        <div className="library-filters">
                          <label className="compact-label">
                            View
                            <select
                              aria-label="Project archive filter"
                              value={archive}
                              onChange={(e) => {
                                setArchive(e.target.value);
                                setPage(0);
                              }}
                            >
                              <option value="active">Active</option>
                              <option value="archived">Archived</option>
                              <option value="all">All projects</option>
                            </select>
                          </label>
                          <label className="compact-label">
                            Platform
                            <select
                              aria-label="Filter platform"
                              value={platform}
                              onChange={(e) => {
                                setPlatform(e.target.value);
                                setPage(0);
                              }}
                            >
                              <option value="all">All platforms</option>
                              {platforms.map((p) => (
                                <option key={p}>{p}</option>
                              ))}
                            </select>
                          </label>
                          <label className="compact-label">
                            Status
                            <select
                              aria-label="Filter project status"
                              value={statusFilter}
                              onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(0);
                              }}
                            >
                              {[
                                "all",
                                "new",
                                "approved",
                                "clarifications needed",
                                "in progress",
                                "completed",
                              ].map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </label>
                          <label className="compact-label">
                            Sort
                            <select
                              aria-label="Sort projects"
                              value={sort}
                              onChange={(e) => setSort(e.target.value)}
                            >
                              <option value="newest">Newest first</option>
                              <option value="name">Name</option>
                            </select>
                          </label>
                        </div>
                      </div>
                      {!store.projects.length ? (
                        <>
                          <section className="empty-state">
                            <EmptyIllustration />
                            <div className="empty-copy">
                              <span className="pill">No projects yet</span>
                              <h2>Start with a conversation.</h2>
                              <p>
                                Create a project, capture what your client said,
                                and turn it into a brief you can review.
                              </p>
                              <ul className="empty-features">
                                {[
                                  ["accent", "Source-linked requirements"],
                                  ["success", "Scope version history"],
                                  ["warning", "Stored on your device"],
                                ].map(([tone, label]) => (
                                  <li className={`tone-${tone}`} key={label}>
                                    <span>
                                      <Check size={12} strokeWidth={3} />
                                    </span>
                                    {label}
                                  </li>
                                ))}
                              </ul>
                              <div className="hero-actions">
                                <button
                                  className="primary large"
                                  onClick={() => setModal("create")}
                                >
                                  <Plus size={18} strokeWidth={2.2} />
                                  Create your first project
                                </button>
                                <a className="link-button" href="#how">
                                  See how it works
                                  <ArrowRight size={16} />
                                </a>
                              </div>
                            </div>
                          </section>
                          <section
                            id="how"
                            className="how-it-works"
                            aria-labelledby="how-title"
                          >
                            <div className="how-heading">
                              <h2 id="how-title">How it works</h2>
                              <span>
                                Three steps from call to confident scope
                              </span>
                            </div>
                            <ol>
                              {(
                                [
                                  [
                                    1,
                                    "Capture the conversation",
                                    "Paste notes, a chat or a call transcript into a project.",
                                  ],
                                  [
                                    2,
                                    "Extract linked scope",
                                    "Every requirement points back to the exact words it came from.",
                                  ],
                                  [
                                    3,
                                    "Review & approve",
                                    "Compare versions, resolve changes and lock in an approved brief.",
                                  ],
                                ] as const
                              ).map(([step, title, body]) => (
                                <li key={step} className={`step step-${step}`}>
                                  <StepIllustration step={step} />
                                  <div>
                                    <span>0{step}</span>
                                    <h3>{title}</h3>
                                    <p>{body}</p>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </section>
                        </>
                      ) : !filtered.length ? (
                        <div className="inline-empty">
                          <Search size={26} />
                          <h2>No matching projects</h2>
                          <p>Try another search or clear the filters.</p>
                          <button
                            className="secondary"
                            onClick={() => {
                              setSearch("");
                              setArchive("all");
                              setPlatform("all");
                              setStatusFilter("all");
                              setPage(0);
                            }}
                          >
                            Clear filters
                          </button>
                        </div>
                      ) : (
                        <div className="project-library">
                          <div className="library-table-heading">
                            <span>Project / client</span>
                            <span>Status</span>
                            <span>Scope review</span>
                            <span>Created</span>
                            <span />
                          </div>
                          {visible.map((p) => (
                            <article className="library-project" key={p.id}>
                              <div className="library-project-name">
                                <span className="project-icon">
                                  <Folder size={20} />
                                </span>
                                <div>
                                  <button
                                    className="project-name-button"
                                    onClick={() => openProject(p)}
                                  >
                                    {p.title}
                                  </button>
                                  <p>
                                    {p.client} · {p.platform}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`badge ${p.versions.length && !p.archived ? "approved" : ""}`}
                              >
                                {status(p)}
                              </span>
                              <span className="review-count">
                                {
                                  p.proposals.filter(
                                    (c) => c.status === "pending",
                                  ).length
                                }{" "}
                                pending
                                {readiness(p).percent !== undefined && (
                                  <small>
                                    {" "}
                                    · {readiness(p).percent}% ready
                                  </small>
                                )}
                              </span>
                              <span className="project-date">
                                {date(p.createdAt)}
                              </span>
                              <button
                                className="icon-button"
                                aria-label={`Open ${p.title}`}
                                onClick={() => openProject(p)}
                              >
                                <ArrowRight size={18} />
                              </button>
                            </article>
                          ))}
                        </div>
                      )}
                      {filtered.length > 8 && (
                        <div className="pagination">
                          <span>
                            {currentPage * 8 + 1}–
                            {Math.min((currentPage + 1) * 8, filtered.length)}{" "}
                            of {filtered.length} projects
                          </span>
                          <div>
                            <button
                              className="secondary"
                              aria-label="Previous page"
                              disabled={currentPage === 0}
                              onClick={() => setPage(currentPage - 1)}
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button
                              className="secondary"
                              aria-label="Next page"
                              disabled={currentPage === pages - 1}
                              onClick={() => setPage(currentPage + 1)}
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    project && (
                      <>
                        <div className="project-summary">
                          <span
                            className={`badge ${project.versions.length ? "approved" : ""}`}
                          >
                            {project.versions.at(-1)
                              ? `Baseline v${project.versions.at(-1)!.number}`
                              : "Draft brief"}
                          </span>
                          <span>{status(project)}</span>
                          <span>{project.sources.length} captures</span>
                          <span>{project.items.length} brief items</span>
                          {(!!project.revisionPolicy ||
                            !!project.revisions?.length) && (
                            <span
                              className={
                                revisionUsage(project).exhausted
                                  ? "summary-warning"
                                  : undefined
                              }
                            >
                              Revisions {revisionUsage(project).used}
                              {project.revisionPolicy &&
                                ` of ${project.revisionPolicy.limit}`}
                            </span>
                          )}
                          {readiness(project).percent !== undefined && (
                            <span
                              className={
                                readiness(project).percent! < 100
                                  ? "summary-warning"
                                  : undefined
                              }
                            >
                              {readiness(project).percent}% ready to start
                            </span>
                          )}
                          {project.confirmations?.some(
                            (c) =>
                              c.version === project.versions.at(-1)?.number,
                          ) && (
                            <span className="summary-success">
                              Client confirmed v
                              {project.versions.at(-1)!.number}
                            </span>
                          )}
                          {project.tags && <span>{project.tags}</span>}
                          <button
                            className="text-button"
                            onClick={() =>
                              ask(
                                project.archived
                                  ? "Unarchive project?"
                                  : "Archive project?",
                                project.archived
                                  ? "Return this project to your active workspace."
                                  : "Keep its brief and history while moving it out of the active list.",
                                project.archived
                                  ? "Unarchive project"
                                  : "Archive project",
                                async () => {
                                  await updateProject(project, (p) => ({
                                    ...p,
                                    archived: !p.archived,
                                  }));
                                  notify(
                                    project.archived
                                      ? "Project restored to active."
                                      : "Project archived.",
                                  );
                                },
                              )
                            }
                          >
                            <Archive size={15} />
                            {project.archived ? "Unarchive" : "Archive"}
                          </button>
                        </div>
                        <section className="project-panel">
                          <div
                            className="tabs"
                            role="tablist"
                            aria-label="Project sections"
                          >
                            {tabs.map((t) => (
                              <button
                                key={t.id}
                                role="tab"
                                id={`tab-${t.id}`}
                                aria-selected={tab === t.id}
                                aria-controls="project-tabpanel"
                                className={tab === t.id ? "current" : ""}
                                tabIndex={tab === t.id ? 0 : -1}
                                onClick={() => setTab(t.id)}
                                onKeyDown={(event) => {
                                  const i = tabs.findIndex((t) => t.id === tab);
                                  const next =
                                    event.key === "ArrowRight"
                                      ? tabs[(i + 1) % tabs.length]
                                      : event.key === "ArrowLeft"
                                        ? tabs[
                                            (i - 1 + tabs.length) % tabs.length
                                          ]
                                        : event.key === "Home"
                                          ? tabs[0]
                                          : event.key === "End"
                                            ? tabs[tabs.length - 1]
                                            : undefined;
                                  if (next) {
                                    event.preventDefault();
                                    setTab(next.id);
                                    document
                                      .getElementById(`tab-${next.id}`)
                                      ?.focus();
                                  }
                                }}
                              >
                                {t.label}
                                {t.id === "changes" && pendingCount > 0 && (
                                  <span>{pendingCount}</span>
                                )}
                              </button>
                            ))}
                          </div>
                          <div
                            id="project-tabpanel"
                            role="tabpanel"
                            aria-labelledby={`tab-${tab}`}
                            tabIndex={0}
                          >
                            {tab === "brief" && (
                              <BriefView
                                project={project}
                                busy={busy}
                                onAdd={addItem}
                                onEdit={editExisting}
                                onRemove={(item) =>
                                  ask(
                                    project.versions.length
                                      ? "Propose removing this item?"
                                      : "Remove this item?",
                                    project.versions.length
                                      ? "This creates a removal proposal. Approved scope stays unchanged until you review and approve a new version."
                                      : "This item will be removed from the draft.",
                                    project.versions.length
                                      ? "Propose removal"
                                      : "Remove item",
                                    async () => {
                                      await updateProject(project, (p) =>
                                        editItem(p, item, true),
                                      );
                                      notify(
                                        project.versions.length
                                          ? "Removal proposed. Review it in Changes."
                                          : "Draft item removed.",
                                      );
                                    },
                                    true,
                                  )
                                }
                                onReorder={(item, direction) =>
                                  void run(async () => {
                                    await updateProject(project, (p) => {
                                      const items = [...p.items];
                                      const sectionItems = items.filter(
                                        (i) => i.section === item.section,
                                      );
                                      const index = sectionItems.findIndex(
                                        (i) => i.id === item.id,
                                      );
                                      const other =
                                        sectionItems[index + direction];
                                      if (!other) return p;
                                      const a = items.findIndex(
                                          (i) => i.id === item.id,
                                        ),
                                        b = items.findIndex(
                                          (i) => i.id === other.id,
                                        );
                                      [items[a], items[b]] = [
                                        items[b],
                                        items[a],
                                      ];
                                      return { ...p, items };
                                    });
                                  })
                                }
                                onApprove={() =>
                                  ask(
                                    "Approve this scope?",
                                    `${project.items.length} items will be saved as a new approved baseline. Verify the text, evidence, and any missing budget or deadline before continuing.`,
                                    "Approve baseline",
                                    async () => {
                                      await updateProject(project, approve);
                                      notify(
                                        "Baseline approved. Future edits and captures become proposals.",
                                      );
                                    },
                                  )
                                }
                                onExport={exportBrief}
                                onSummary={() => setModal("summary")}
                                exclusionSuggestions={
                                  template?.exclusions || []
                                }
                                onSuggestExclusion={(text) =>
                                  addSuggested("exclusions", text)
                                }
                              />
                            )}
                            {tab === "changes" && (
                              <ChangesView
                                project={project}
                                busy={busy}
                                onReview={review}
                                onChangeOrder={(proposal) =>
                                  openChangeOrder({ kind: "scope", proposal })
                                }
                              />
                            )}
                            {tab === "revisions" && (
                              <RevisionsView
                                project={project}
                                onPolicy={() => {
                                  setSnapshot(project);
                                  setModal("revision-policy");
                                }}
                                onAdd={() => {
                                  setSnapshot(project);
                                  setRevision(undefined);
                                  setModal("revision");
                                }}
                                onEdit={(r) => {
                                  setSnapshot(project);
                                  setRevision(r);
                                  setModal("revision");
                                }}
                                onChangeOrder={(r) =>
                                  openChangeOrder({
                                    kind: "revision",
                                    revision: r,
                                  })
                                }
                                onRemove={(r) =>
                                  ask(
                                    "Delete revision?",
                                    "This removes the revision request and any extra-revision request saved with it.",
                                    "Delete revision",
                                    async () => {
                                      await updateProject(project, (p) => ({
                                        ...p,
                                        revisions: p.revisions?.filter(
                                          (x) => x.id !== r.id,
                                        ),
                                      }));
                                      notify("Revision deleted.");
                                    },
                                    true,
                                  )
                                }
                              />
                            )}
                            {tab === "questions" && (
                              <QuestionsView
                                project={project}
                                onAdd={() => addItem("questions")}
                                onEdit={editExisting}
                                onStatus={(item, questionStatus) =>
                                  void run(async () => {
                                    await updateProject(project, (p) => ({
                                      ...p,
                                      items: p.items.map((i) =>
                                        i.id === item.id
                                          ? {
                                              ...i,
                                              questionStatus,
                                              questionUpdatedAt:
                                                new Date().toISOString(),
                                            }
                                          : i,
                                      ),
                                    }));
                                  }, "Question status updated. Approved snapshot text is unchanged.")
                                }
                                onCopy={(text) =>
                                  void run(
                                    async () => copy(text),
                                    "Clarification copied. Send it through your usual client channel.",
                                  )
                                }
                                suggestions={template?.questions || []}
                                onSuggest={(text) =>
                                  addSuggested("questions", text)
                                }
                              />
                            )}
                            {tab === "checklist" && (
                              <ChecklistView
                                project={project}
                                busy={busy}
                                onTemplate={(t) =>
                                  void run(async () => {
                                    await updateProject(project, (p) =>
                                      applyTemplate(p, t),
                                    );
                                  }, "Project type saved. Missing starter items were added.")
                                }
                                onSave={async (item) => {
                                  await updateProject(project, (p) =>
                                    saveChecklistItem(p, item),
                                  );
                                }}
                                onRemove={(item) =>
                                  void run(async () => {
                                    await updateProject(project, (p) => ({
                                      ...p,
                                      checklist: p.checklist?.filter(
                                        (c) => c.id !== item.id,
                                      ),
                                    }));
                                  }, "Checklist item removed.")
                                }
                              />
                            )}
                            {tab === "payments" && (
                              <PaymentsView
                                project={project}
                                onAdd={() => {
                                  setSnapshot(project);
                                  setPayment(undefined);
                                  setModal("payment");
                                }}
                                onEdit={(p) => {
                                  setSnapshot(project);
                                  setPayment(p);
                                  setModal("payment");
                                }}
                                onRemove={(pay) =>
                                  ask(
                                    "Delete payment?",
                                    "This removes the payment record from this project.",
                                    "Delete payment",
                                    async () => {
                                      await updateProject(project, (p) => ({
                                        ...p,
                                        payments: p.payments?.filter(
                                          (x) => x.id !== pay.id,
                                        ),
                                      }));
                                      notify("Payment deleted.");
                                    },
                                    true,
                                  )
                                }
                              />
                            )}
                            {tab === "sources" && (
                              <div className="tab-content">
                                <div className="view-heading">
                                  <div>
                                    <h3>Conversation sources</h3>
                                    <p className="muted">
                                      Only captures you confirm are saved. Each
                                      extracted item links back to its original
                                      words.
                                    </p>
                                  </div>
                                  <button
                                    className="secondary"
                                    onClick={capture}
                                  >
                                    <Plus size={16} />
                                    Add conversation
                                  </button>
                                </div>
                                {!project.sources.length && (
                                  <div className="inline-empty">
                                    <MessageSquare size={26} />
                                    <h3>No conversations yet</h3>
                                    <p>
                                      Paste a conversation or select text on a
                                      page and use the extension context menu.
                                    </p>
                                  </div>
                                )}
                                {project.sources.map((source) => (
                                  <article
                                    className="source-card"
                                    key={source.id}
                                  >
                                    <div className="source-heading">
                                      <div>
                                        <strong>
                                          {source.url
                                            ? "Website selection"
                                            : "Pasted or imported conversation"}
                                        </strong>
                                        <small>
                                          {new Date(
                                            source.capturedAt,
                                          ).toLocaleString()}
                                        </small>
                                        {source.url && (
                                          <a
                                            className="source-link"
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            {source.url}
                                          </a>
                                        )}
                                      </div>
                                      <button
                                        className="icon-button danger"
                                        aria-label={`Delete capture from ${date(source.capturedAt)}`}
                                        onClick={() =>
                                          ask(
                                            "Delete this conversation?",
                                            "This removes the capture, linked items, related change proposals, and any historical version containing its evidence. Other local backups are not affected.",
                                            "Delete capture",
                                            async () => {
                                              await commit((s) => {
                                                const drafts = { ...s.drafts };
                                                delete drafts[project.id];
                                                return {
                                                  ...s,
                                                  drafts,
                                                  projects: s.projects.map(
                                                    (p) =>
                                                      p.id === project.id
                                                        ? removeCapture(
                                                            p,
                                                            source.id,
                                                          )
                                                        : p,
                                                  ),
                                                };
                                              });
                                              notify(
                                                "Capture and linked records deleted.",
                                              );
                                            },
                                            true,
                                          )
                                        }
                                      >
                                        <Trash2 size={17} />
                                      </button>
                                    </div>
                                    <details>
                                      <summary>
                                        View captured text ·{" "}
                                        {source.text.length.toLocaleString()}{" "}
                                        characters
                                      </summary>
                                      <pre>{source.text}</pre>
                                    </details>
                                  </article>
                                ))}
                              </div>
                            )}
                            {tab === "milestones" && (
                              <div className="tab-content">
                                <div className="view-heading">
                                  <div>
                                    <h3>Delivery plan</h3>
                                    <p className="muted">
                                      Track dates, acceptance criteria, and
                                      prerequisites separately from approved
                                      scope.
                                    </p>
                                  </div>
                                  <button
                                    className="secondary"
                                    onClick={() => {
                                      setSnapshot(project);
                                      setMilestone(undefined);
                                      setModal("milestone");
                                    }}
                                  >
                                    <Plus size={16} />
                                    Add milestone
                                  </button>
                                </div>
                                {!project.milestones?.length && (
                                  <div className="inline-empty">
                                    <Folder size={26} />
                                    <h3>No milestones yet</h3>
                                    <p>
                                      Add delivery checkpoints when the scope is
                                      clear.
                                    </p>
                                  </div>
                                )}
                                {project.milestones?.map((m) => {
                                  const blocked =
                                    m.dependency &&
                                    project.milestones?.find(
                                      (x) => x.id === m.dependency,
                                    )?.status !== "completed";
                                  return (
                                    <article
                                      className="milestone-row"
                                      key={m.id}
                                    >
                                      <div className="source-heading">
                                        <h3>{m.title}</h3>
                                        <span
                                          className={`badge ${m.status === "completed" ? "approved" : ""}`}
                                        >
                                          {m.status}
                                        </span>
                                      </div>
                                      <p className="muted">
                                        Due: {m.due || "unknown"}
                                        {blocked
                                          ? " · Prerequisite not completed"
                                          : ""}
                                      </p>
                                      {m.acceptance && <p>{m.acceptance}</p>}
                                      <div className="button-row">
                                        <button
                                          className="secondary"
                                          onClick={() => {
                                            setSnapshot(project);
                                            setMilestone(m);
                                            setModal("milestone");
                                          }}
                                        >
                                          Edit milestone
                                        </button>
                                        <button
                                          className="text-button danger"
                                          onClick={() =>
                                            ask(
                                              "Delete milestone?",
                                              "The checkpoint will be removed and any milestone depending on it will have its prerequisite cleared.",
                                              "Delete milestone",
                                              async () => {
                                                await updateProject(
                                                  project,
                                                  (p) => ({
                                                    ...p,
                                                    milestones: p.milestones
                                                      ?.filter(
                                                        (x) => x.id !== m.id,
                                                      )
                                                      .map((x) =>
                                                        x.dependency === m.id
                                                          ? {
                                                              ...x,
                                                              dependency: "",
                                                            }
                                                          : x,
                                                      ),
                                                  }),
                                                );
                                              },
                                              true,
                                            )
                                          }
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </article>
                                  );
                                })}
                              </div>
                            )}
                            {tab === "history" && (
                              <div className="tab-content">
                                <div className="view-heading">
                                  <div>
                                    <h3>Approved versions</h3>
                                    <p className="muted">
                                      Snapshots of scope you explicitly
                                      approved. Working drafts never overwrite
                                      these records.
                                    </p>
                                  </div>
                                </div>
                                {!project.versions.length && (
                                  <div className="inline-empty">
                                    <ShieldCheck size={26} />
                                    <h3>No approved baseline yet</h3>
                                    <p>
                                      Review the project brief and approve your
                                      first version.
                                    </p>
                                  </div>
                                )}
                                {[...project.versions].reverse().map((v) => (
                                  <article
                                    className="version-row"
                                    key={v.number}
                                  >
                                    <div className="source-heading">
                                      <strong>Baseline v{v.number}</strong>
                                      <span className="badge approved">
                                        Approved by you
                                      </span>
                                    </div>
                                    <p className="muted">
                                      {new Date(v.approvedAt).toLocaleString()}{" "}
                                      · {v.items.length} items
                                    </p>
                                    {project.confirmations
                                      ?.filter((c) => c.version === v.number)
                                      .map((c) => (
                                        <details
                                          key={c.id}
                                          className="confirmation"
                                        >
                                          <summary>
                                            <ShieldCheck size={14} /> Client
                                            confirmed · recorded{" "}
                                            {new Date(
                                              c.recordedAt,
                                            ).toLocaleDateString()}
                                          </summary>
                                          <blockquote>{c.excerpt}</blockquote>
                                        </details>
                                      ))}
                                    <details>
                                      <summary>View approved scope</summary>
                                      {sectionsForHistory(v.items)}
                                    </details>
                                  </article>
                                ))}
                              </div>
                            )}
                          </div>
                        </section>
                        {project.notes && (
                          <section className="project-notes">
                            <h3>Project notes</h3>
                            <p>{project.notes}</p>
                          </section>
                        )}
                        <div className="project-footer">
                          <button
                            className="text-button"
                            onClick={() =>
                              void run(
                                async () => copy(markdown(project)),
                                "Approved scope copied.",
                              )
                            }
                            disabled={!project.versions.length}
                          >
                            <Copy size={15} />
                            Copy approved summary
                          </button>
                          <button
                            className="text-button danger"
                            onClick={() =>
                              ask(
                                "Delete this project?",
                                `Permanently delete ${project.title}, its conversations, drafts, changes, and approved versions from this device.`,
                                "Delete project",
                                async () => {
                                  await commit((s) => {
                                    const drafts = { ...s.drafts };
                                    delete drafts[project.id];
                                    return {
                                      ...s,
                                      projects: s.projects.filter(
                                        (p) => p.id !== project.id,
                                      ),
                                      drafts,
                                    };
                                  });
                                  allProjects();
                                  notify("Project deleted.");
                                },
                                true,
                              )
                            }
                          >
                            <Trash2 size={15} />
                            Delete project
                          </button>
                        </div>
                      </>
                    )
                  )}
                </>
              )
            )}
            <footer className="page-footer">
              <ShieldCheck size={14} />
              Private workspace · Local processing<span>ClientBrief AI</span>
            </footer>
          </div>
        </main>
      </div>
      {(modal === "create" || modal === "edit-project") && (
        <ProjectForm
          project={modal === "edit-project" ? snapshot : undefined}
          clients={clients}
          defaultTemplate={store.settings?.defaultTemplate}
          onClose={() => {
            setModal(null);
            setImportNext(false);
          }}
          onSave={async (value) => {
            if (modal === "edit-project" && snapshot)
              await updateProject(snapshot, () => value);
            else {
              await commit((s) => ({ ...s, projects: [...s.projects, value] }));
              openProject(value);
              if (importNext) setCaptureFor(value.id);
            }
            notify(
              modal === "edit-project"
                ? "Project updated."
                : "Project created. Add a conversation to start your brief.",
            );
          }}
        />
      )}
      {modal === "capture" && project && (
        <CaptureDialog
          projectTitle={project.title}
          initialText={pending?.text || store.drafts[project.id] || ""}
          initialUrl={pending?.url || ""}
          onClose={() => setModal(null)}
          onDraft={async (text) => {
            await commit((s) => {
              if (!s.projects.some((p) => p.id === project.id))
                throw Error("This project was deleted.");
              return { ...s, drafts: { ...s.drafts, [project.id]: text } };
            });
          }}
          onSave={async (text, url, speakers, progress) => {
            const parts = splitThread(text);
            if (!parts.length) throw Error("Enter the conversation text.");
            const capturedAt = pending?.capturedAt || new Date().toISOString();
            for (const [index, part] of parts.entries()) {
              progress(index, parts.length);
              const hash = await contentHash(part);
              const used = Object.fromEntries(
                Object.entries(speakers).filter(([name]) =>
                  part.includes(name),
                ),
              );
              const source = {
                id: id(),
                text: part,
                url,
                capturedAt,
                hash,
                ...(Object.keys(used).length ? { speakers: used } : {}),
              };
              try {
                await commit((s) => {
                  const p = s.projects.find((p) => p.id === project.id);
                  if (!p) throw Error("This project was deleted.");
                  // Resuming a partly saved thread skips parts already captured.
                  if (
                    parts.length > 1 &&
                    p.sources.some((x) => x.hash === hash)
                  )
                    return s;
                  const result = addCapture(p, source);
                  const drafts = { ...s.drafts };
                  const rest = parts.slice(index + 1).join("\n");
                  if (rest) drafts[p.id] = rest;
                  else delete drafts[p.id];
                  return {
                    ...s,
                    projects: s.projects.map((p) =>
                      p.id === result.id ? result : p,
                    ),
                    drafts,
                  };
                });
              } catch (error) {
                throw Error(
                  index
                    ? `Saved ${index} of ${parts.length} parts. ${(error as Error).message} The remaining text is kept as a draft; retry to continue.`
                    : (error as Error).message,
                  { cause: error },
                );
              }
            }
            if (extension() && pending) {
              try {
                await chrome.storage.local.remove("pendingCapture");
              } catch {
                notify(
                  "Capture saved, but pending selection could not be cleared. You can discard it manually.",
                  true,
                );
              }
            }
            setPending(null);
            setTab(project.versions.length ? "changes" : "brief");
            notify(
              "Capture saved. Review each suggested item before approving.",
            );
          }}
        />
      )}
      {modal === "item" && project && (
        <ItemEditor
          item={edit}
          section={section}
          baseline={!!project.versions.length}
          onClose={() => setModal(null)}
          onSave={async (item) => {
            await updateProject(snapshot || project, (p) => editItem(p, item));
            notify(
              project.versions.length
                ? "Change proposed. Review it in Changes."
                : "Brief item saved.",
            );
            if (project.versions.length) setTab("changes");
          }}
        />
      )}
      {modal === "milestone" && project && (
        <MilestoneEditor
          value={milestone}
          milestones={project.milestones || []}
          onClose={() => setModal(null)}
          onSave={async (m) => {
            await updateProject(snapshot || project, (p) => ({
              ...p,
              milestones: p.milestones?.some((x) => x.id === m.id)
                ? p.milestones.map((x) => (x.id === m.id ? m : x))
                : [...(p.milestones || []), m],
            }));
            notify("Milestone saved.");
          }}
        />
      )}
      {modal === "revision-policy" && project && (
        <RevisionPolicyEditor
          project={project}
          onClose={() => setModal(null)}
          onSave={async (policy) => {
            await updateProject(snapshot || project, (p) =>
              setRevisionPolicy(p, policy),
            );
            notify("Included revisions saved.");
          }}
        />
      )}
      {modal === "revision" && project && (
        <RevisionEditor
          project={project}
          value={revision}
          onClose={() => setModal(null)}
          onSave={async (r) => {
            await updateProject(snapshot || project, (p) => saveRevision(p, r));
            const after = revisionUsage(saveRevision(project, r));
            notify(
              after.over
                ? "Revision saved. It is beyond the agreed limit: draft an extra-revision request."
                : "Revision saved.",
            );
          }}
        />
      )}
      {modal === "change-order" && project && orderFor && (
        <ChangeOrderDialog
          kind={orderFor.kind}
          client={project.client}
          request={
            orderFor.kind === "scope"
              ? orderFor.proposal.item.text
              : orderFor.revision.note
          }
          version={project.versions.at(-1)?.number}
          limit={project.revisionPolicy?.limit}
          value={
            orderFor.kind === "scope"
              ? orderFor.proposal.changeOrder
              : orderFor.revision.changeOrder
          }
          defaultCurrency={
            [
              ...project.proposals.map((p) => p.changeOrder),
              ...(project.revisions || []).map((r) => r.changeOrder),
            ]
              .reverse()
              .find((o) => o?.currency)?.currency || ""
          }
          onClose={() => setModal(null)}
          onCopy={(text) =>
            void run(
              async () => copy(text),
              "Message copied. Send it through your usual client channel.",
            )
          }
          onSave={async (order) => {
            await updateProject(snapshot || project, (p) =>
              orderFor.kind === "scope"
                ? setChangeOrder(p, orderFor.proposal.id, order)
                : saveRevision(p, {
                    ...(p.revisions?.find(
                      (r) => r.id === orderFor.revision.id,
                    ) || orderFor.revision),
                    changeOrder: order,
                  }),
            );
            notify("Change order saved.");
          }}
        />
      )}
      {modal === "payment" && project && (
        <PaymentEditor
          project={project}
          value={payment}
          defaultCurrency={
            [...(project.payments || [])].reverse().find((p) => p.currency)
              ?.currency || ""
          }
          onClose={() => setModal(null)}
          onSave={async (p) => {
            await updateProject(snapshot || project, (x) => savePayment(x, p));
            notify("Payment saved.");
          }}
        />
      )}
      {modal === "summary" && project && project.versions.length > 0 && (
        <ClientSummaryDialog
          project={project}
          onClose={() => setModal(null)}
          onCopy={(text) =>
            void run(
              async () => copy(text),
              "Summary copied. Send it to your client and capture their reply.",
            )
          }
          onConfirm={async (c) => {
            await updateProject(project, (p) => recordConfirmation(p, c));
            notify("Client confirmation recorded with evidence.");
          }}
        />
      )}
      {modal === "client" && clientEdit && (
        <ClientEditor
          value={clientEdit.record}
          isNew={clientEdit.isNew}
          onClose={() => setModal(null)}
          onSave={async (c) => {
            await commit((s) =>
              saveClient(
                s,
                c,
                clientEdit.isNew ? undefined : clientEdit.record.name,
              ),
            );
            notify("Client saved.");
          }}
        />
      )}
      {modal === "settings" && (
        <SettingsDialog
          store={store}
          onClose={() => setModal(null)}
          onSettings={async (settings) => {
            await commit((s) => ({ ...s, settings }));
          }}
          onRestore={async (backup) => {
            await commit((s) => ({ ...backup, revision: s.revision }));
            allProjects();
            notify("Workspace restored from the validated backup.");
          }}
          onReset={() => {
            setModal(null);
            ask(
              "Delete all workspace data?",
              "All local projects, conversations, drafts, changes and versions will be permanently deleted. Backups you exported are not removed.",
              "Delete all data",
              async () => {
                await commit((s) => ({
                  ...structuredClone(emptyStore),
                  revision: s.revision,
                }));
                if (extension())
                  await chrome.storage.local.remove("pendingCapture");
                setPending(null);
                allProjects();
                notify("Workspace data deleted.");
              },
              true,
            );
          }}
        />
      )}
      {confirmation && (
        <ConfirmDialog
          title={confirmation.title}
          description={confirmation.description}
          label={confirmation.label}
          danger={confirmation.danger}
          onClose={() => setConfirmation(null)}
          onConfirm={confirmation.action}
        />
      )}
    </>
  );
}
function sectionsForHistory(items: Item[]) {
  return Object.entries(labels).map(([section, title]) => (
    <section className="history-section" key={section}>
      <h3>{title}</h3>
      {items.some((i) => i.section === section) ? (
        items
          .filter((i) => i.section === section)
          .map((i) => <p key={i.id}>{i.text}</p>)
      ) : (
        <p className="muted">Not mentioned</p>
      )}
    </section>
  ));
}
