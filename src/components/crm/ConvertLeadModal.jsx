import { useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Button, Modal } from "../ui";
import { convertLead } from "../../store/slices/crm/crmSlice";

const ConvertLeadModal = ({ isOpen, onClose, leadId, basePath, navigate }) => {
  const dispatch = useDispatch();
  const [converting, setConverting] = useState(false);
  const [form, setForm] = useState({
    assignedTo: "",
    accountMode: "create",
    existingAccountId: "",
    dealStage: "",
  });

  const handleConvert = async () => {
    try {
      setConverting(true);
      const result = await dispatch(
        convertLead({
          leadId,
          payload: {
            ownerId: form.assignedTo || undefined,
            accountId:
              form.accountMode === "existing"
                ? form.existingAccountId
                : undefined,
            initialDealStage: form.dealStage || undefined,
          },
        }),
      ).unwrap();

      toast.success("Lead converted successfully");
      onClose();
      if (result?.deal?._id) {
        navigate(`${basePath}/deals/${result.deal._id}`);
      }
    } catch (error) {
      toast.error(error || "Lead conversion failed");
    } finally {
      setConverting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convert Lead">
      <div className="space-y-4">
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          This creates Contact, Account, and Deal and prevents double
          conversion.
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            value={form.accountMode}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, accountMode: e.target.value }))
            }
          >
            <option value="create">Create New Account</option>
            <option value="existing">Use Existing Account</option>
          </select>
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            placeholder="Assigned To User ID (optional)"
            value={form.assignedTo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, assignedTo: e.target.value }))
            }
          />
          {form.accountMode === "existing" && (
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white md:col-span-2"
              placeholder="Existing Account ID"
              value={form.existingAccountId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  existingAccountId: e.target.value,
                }))
              }
            />
          )}
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white md:col-span-2"
            placeholder="Initial Deal Stage"
            value={form.dealStage}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dealStage: e.target.value }))
            }
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConvert} loading={converting}>
            Convert and Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConvertLeadModal;
