import { useEffect, useRef, useState } from "react";
import { Check, FileUp, ShieldCheck } from "lucide-react";
import Dialog from "./Dialog";
import { redact } from "../lib/model";
import { readTextFile } from "../lib/files";
export type PendingCapture = { text: string; url: string; capturedAt: string };
export default function CaptureDialog({
  projectTitle,
  initialText,
  initialUrl,
  onDraft,
  onSave,
  onClose,
}: {
  projectTitle: string;
  initialText: string;
  initialUrl: string;
  onDraft: (text: string) => Promise<void>;
  onSave: (text: string, url: string) => Promise<void>;
  onClose: () => void;
}) {
  const [text, setText] = useState(initialText);
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef(onDraft);
  draftRef.current = onDraft;
  const queue = useRef(Promise.resolve());
  const saveDraft = (value: string) => {
    const task = queue.current
      .catch(() => {})
      .then(() => draftRef.current(value));
    queue.current = task;
    return task;
  };
  useEffect(() => {
    if (busy) return;
    const timer = setTimeout(() => {
      const task = queue.current
        .catch(() => {})
        .then(() => draftRef.current(text));
      queue.current = task;
      void task
        .then(() => setSaved(true))
        .catch((error) => setError((error as Error).message));
    }, 800);
    return () => clearTimeout(timer);
  }, [text, busy]);
  async function close() {
    setBusy(true);
    try {
      await saveDraft(text);
      onClose();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title="Add conversation"
      description={`Project: ${projectTitle}. Review the text before confirming. Only the text below will be saved.`}
      onClose={() => void close()}
      busy={busy}
    >
      <div className="inline-info">
        <ShieldCheck size={18} />
        <span>
          Local processing only. This organizer uses keyword rules, not an AI
          model. Every suggested item needs your review.
        </span>
      </div>
      <div className="capture-tools">
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.csv"
          className="visually-hidden"
          aria-label="Import conversation file"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const value = await readTextFile(file);
              setText(value);
              setSaved(false);
              setError("");
            } catch (error) {
              setError((error as Error).message);
            }
            e.target.value = "";
          }}
        />
        <button
          className="secondary"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          <FileUp size={16} /> Import text file
        </button>
        <button
          className="secondary"
          disabled={busy || !text}
          onClick={() => {
            setText(redact(text));
            setSaved(false);
          }}
        >
          Redact sensitive details
        </button>
      </div>
      <p className="field-hint">
        Imports: TXT, Markdown, or raw CSV text. Redaction covers common email,
        international phone, and credential patterns. Review the result
        manually.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            await queue.current.catch(() => {});
            await onSave(text, url);
            onClose();
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Conversation
          <textarea
            aria-label="Conversation"
            autoFocus
            rows={10}
            required
            maxLength={100000}
            value={text}
            disabled={busy}
            onChange={(e) => {
              setText(e.target.value);
              setSaved(false);
            }}
            placeholder="Paste relevant client messages. One item per line works best."
          />
        </label>
        <label>
          Source URL (optional)
          <input
            type="url"
            maxLength={2048}
            value={url}
            disabled={busy}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <div className="field-meta">
          <span>{text.length.toLocaleString()} / 100,000 characters</span>
          <span role="status">
            {saved
              ? "Draft saved on this device"
              : "Draft autosaves while you type"}
          </span>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button
            className="secondary"
            type="button"
            disabled={busy}
            onClick={() => void close()}
          >
            Save draft & close
          </button>
          <button
            className="primary"
            type="submit"
            disabled={busy || !text.trim()}
          >
            <Check size={16} />
            {busy ? "Saving…" : "Confirm capture & organize"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
