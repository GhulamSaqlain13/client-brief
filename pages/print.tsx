import Head from "next/head";
import { useEffect, useState } from "react";
import { FileText, Printer } from "lucide-react";
import { readStore } from "../lib/storage";
import { labels, sections, type Project } from "../lib/model";
export default function Print() {
  const [project, setProject] = useState<Project>();
  const [error, setError] = useState("");
  const [exportedAt, setExportedAt] = useState("");
  useEffect(() => {
    readStore()
      .then((store) => {
        const p = store.projects.find(
          (p) => p.id === new URLSearchParams(location.search).get("project"),
        );
        if (!p) throw Error("Project not found.");
        if (!p.versions.length)
          throw Error("Approve a baseline before exporting.");
        setProject(p);
        setExportedAt(new Date().toISOString());
      })
      .catch((error) => setError(error.message));
  }, []);
  const baseline = project?.versions.at(-1);
  return (
    <div className="print-page">
      <Head>
        <title>{project?.title || "Approved brief"} · ClientBrief</title>
      </Head>
      <div className="print-controls no-print">
        <p>
          Print this approved version or choose “Save as PDF” in your browser.
        </p>
        <button
          className="primary"
          disabled={!baseline}
          onClick={() => window.print()}
        >
          <Printer size={16} />
          Print / Save as PDF
        </button>
      </div>
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : !baseline || !project ? (
        <p role="status">Loading approved brief…</p>
      ) : (
        <article className="print-document">
          <header>
            <div className="print-brand">
              <FileText size={20} />
              ClientBrief AI
            </div>
            <h1>{project.title}</h1>
            <dl className="print-metadata">
              <div>
                <dt>Client</dt>
                <dd>{project.client}</dd>
              </div>
              <div>
                <dt>Approved version</dt>
                <dd>v{baseline.number}</dd>
              </div>
              <div>
                <dt>Approved at</dt>
                <dd>{baseline.approvedAt}</dd>
              </div>
              <div>
                <dt>Exported at</dt>
                <dd>{exportedAt}</dd>
              </div>
            </dl>
          </header>
          {sections.map((section) => (
            <section className="print-section" key={section}>
              <h2>{labels[section]}</h2>
              {baseline.items.some((i) => i.section === section) ? (
                <ul>
                  {baseline.items
                    .filter((i) => i.section === section)
                    .map((i) => (
                      <li key={i.id}>
                        <p>{i.text}</p>
                        <small>
                          {i.priority || "should"} · {i.state} ·{" "}
                          {i.manual
                            ? "Manually entered"
                            : `Source ${i.sourceId}`}
                        </small>
                      </li>
                    ))}
                </ul>
              ) : (
                <p>Unknown — not mentioned in approved scope.</p>
              )}
            </section>
          ))}
          <section className="print-section">
            <h2>Evidence appendix</h2>
            {baseline.items
              .filter((i) => i.sourceId && i.excerpt)
              .map((i) => (
                <div className="print-evidence" key={i.id}>
                  <p>
                    Source {i.sourceId} ·{" "}
                    {
                      project.sources.find((s) => s.id === i.sourceId)
                        ?.capturedAt
                    }
                  </p>
                  <blockquote>{i.excerpt}</blockquote>
                </div>
              ))}
          </section>
        </article>
      )}
    </div>
  );
}
