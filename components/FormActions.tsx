import { useState } from "react";
export function Actions({
  busy,
  error,
  label,
  onClose,
}: {
  busy: boolean;
  error: string;
  label: string;
  onClose: () => void;
}) {
  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="dialog-actions">
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onClose}
        >
          Cancel
        </button>
        <button className="primary" disabled={busy}>
          {busy ? "Saving…" : label}
        </button>
      </div>
    </>
  );
}
export function useSubmit(onClose: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      onClose();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
}
