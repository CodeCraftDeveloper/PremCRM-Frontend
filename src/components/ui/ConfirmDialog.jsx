import { AlertTriangle } from "lucide-react";
import { Button, Modal } from "./index";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  variant = "danger",
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
