import { useState } from "react";
import Dialog from "./Dialog";
export default function ConfirmDialog({
  title,
  description,
  label = "Confirm",
  danger,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  label?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog
      title={title}
      description={description}
      onClose={onClose}
      busy={busy}
    >
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="dialog-actions">
        <button
          className="secondary"
          autoFocus
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          className={danger ? "primary destructive" : "primary"}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Could not complete this action.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Working…" : label}
        </button>
      </div>
    </Dialog>
  );
}
