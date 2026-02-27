import { useState, useCallback } from "react";

/**
 * Hook for confirm-before-action pattern (delete, bulk delete, etc.)
 *
 * Usage:
 *   const { confirm, ConfirmModal } = useConfirmAction();
 *   confirm({ title, message, onConfirm: () => dispatch(delete(id)) });
 *   // Render <ConfirmModal /> in your JSX
 */
const useConfirmAction = () => {
  const [state, setState] = useState({
    open: false,
    title: "",
    message: "",
    variant: "danger",
    onConfirm: null,
    loading: false,
  });

  const confirm = useCallback(
    ({
      title = "Confirm",
      message = "Are you sure?",
      variant = "danger",
      onConfirm,
    }) => {
      setState({
        open: true,
        title,
        message,
        variant,
        onConfirm,
        loading: false,
      });
    },
    [],
  );

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!state.onConfirm) return;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      await state.onConfirm();
    } finally {
      setState((prev) => ({ ...prev, open: false, loading: false }));
    }
  }, [state]);

  const ConfirmModal = () => {
    if (!state.open) return null;
    const isDanger = state.variant === "danger";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {state.title}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {state.message}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={state.loading}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                isDanger
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {state.loading ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return { confirm, ConfirmModal };
};

export default useConfirmAction;
