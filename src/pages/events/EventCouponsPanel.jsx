import { useEffect, useState, useCallback } from "react";
import { Percent, Ticket, Tag, Pencil, X } from "lucide-react";
import { eventRegistrationsService, ticketTypesService } from "../../services";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "10",
  maxDiscountAmount: "",
  minQuantity: "1",
  maxUses: "",
  applicableTicketTypeIds: [],
  isActive: true,
};

export default function EventCouponsPanel({ eventId }) {
  const [coupons, setCoupons] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingCouponId, setEditingCouponId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [couponsRes, ticketTypesRes] = await Promise.all([
        eventRegistrationsService.getCoupons(eventId),
        ticketTypesService.getAll(eventId),
      ]);
      setCoupons(couponsRes.data?.coupons || []);
      setTicketTypes(ticketTypesRes.data?.ticketTypes || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        description: form.description,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscountAmount:
          form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
        minQuantity: Number(form.minQuantity || 1),
        maxUses: form.maxUses === "" ? null : Number(form.maxUses),
        applicableTicketTypeIds: form.applicableTicketTypeIds,
        isActive: form.isActive,
      };

      if (editingCouponId) {
        await eventRegistrationsService.updateCoupon(
          eventId,
          editingCouponId,
          payload,
        );
        toast.success("Coupon updated");
      } else {
        await eventRegistrationsService.createCoupon(eventId, payload);
        toast.success("Coupon created");
      }

      setForm(EMPTY_FORM);
      setEditingCouponId(null);
      load();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          (editingCouponId
            ? "Failed to update coupon"
            : "Failed to create coupon"),
      );
    } finally {
      setSaving(false);
    }
  };

  const beginEditCoupon = (coupon) => {
    setEditingCouponId(coupon._id);
    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountValue: String(coupon.discountValue ?? ""),
      maxDiscountAmount:
        coupon.maxDiscountAmount == null
          ? ""
          : String(coupon.maxDiscountAmount),
      minQuantity: String(coupon.minQuantity ?? 1),
      maxUses: coupon.maxUses == null ? "" : String(coupon.maxUses),
      applicableTicketTypeIds: (coupon.applicableTicketTypeIds || []).map(
        (tt) => (typeof tt === "string" ? tt : tt._id),
      ),
      isActive: coupon.isActive ?? true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingCouponId(null);
    setForm(EMPTY_FORM);
  };

  const toggleCoupon = async (coupon) => {
    try {
      await eventRegistrationsService.updateCoupon(eventId, coupon._id, {
        isActive: !coupon.isActive,
      });
      toast.success(`Coupon ${coupon.isActive ? "paused" : "activated"}`);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update coupon");
    }
  };

  const toggleApplicableTicket = (ticketTypeId) => {
    setForm((prev) => ({
      ...prev,
      applicableTicketTypeIds: prev.applicableTicketTypeIds.includes(
        ticketTypeId,
      )
        ? prev.applicableTicketTypeIds.filter((id) => id !== ticketTypeId)
        : [...prev.applicableTicketTypeIds, ticketTypeId],
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <form
        onSubmit={submit}
        className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingCouponId ? "Edit Coupon" : "Coupon Codes"}
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create event-specific discounts for registration checkout.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
              Code
            </label>
            <input
              value={form.code}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  code: e.target.value.toUpperCase(),
                }))
              }
              placeholder="EARLYBIRD"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
              Discount Type
            </label>
            <select
              value={form.discountType}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, discountType: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
              Discount Value
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.discountValue}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, discountValue: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
              Max Discount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.maxDiscountAmount}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  maxDiscountAmount: e.target.value,
                }))
              }
              placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
              Min Quantity
            </label>
            <input
              type="number"
              min="1"
              value={form.minQuantity}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, minQuantity: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
              Max Uses
            </label>
            <input
              type="number"
              min="1"
              value={form.maxUses}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, maxUses: e.target.value }))
              }
              placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
            Description
          </label>
          <input
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Optional internal note"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Applicable Tickets
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Leave all unchecked to allow this coupon on every ticket type.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ticketTypes.map((ticketType) => (
              <label
                key={ticketType._id}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
              >
                <input
                  type="checkbox"
                  checked={form.applicableTicketTypeIds.includes(
                    ticketType._id,
                  )}
                  onChange={() => toggleApplicableTicket(ticketType._id)}
                />
                <span className="dark:text-gray-200">{ticketType.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            <Tag className="h-4 w-4" />
            {saving
              ? "Saving..."
              : editingCouponId
                ? "Update Coupon"
                : "Create Coupon"}
          </button>
          {editingCouponId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              <X className="h-4 w-4" />
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Coupon Inventory
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track coupon usage and pause codes without deleting history.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Loading coupons...
          </p>
        ) : coupons.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No coupons created for this event yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {coupons.map((coupon) => (
              <div
                key={coupon._id}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
                        {coupon.code}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${coupon.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200" : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"}`}
                      >
                        {coupon.isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-900 dark:text-white">
                      {coupon.discountType === "percentage"
                        ? `${coupon.discountValue}% off`
                        : `${coupon.discountValue} off`}
                      {coupon.maxDiscountAmount
                        ? ` · cap ${coupon.maxDiscountAmount}`
                        : ""}
                    </p>
                    {coupon.description && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {coupon.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Used {coupon.usedCount}
                      {coupon.maxUses ? ` / ${coupon.maxUses}` : " times"} · min
                      qty {coupon.minQuantity}
                    </p>
                  </div>
                  <button
                    onClick={() => beginEditCoupon(coupon)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-900"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </span>
                  </button>
                  <button
                    onClick={() => toggleCoupon(coupon)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-900"
                  >
                    {coupon.isActive ? "Pause" : "Activate"}
                  </button>
                </div>
                {coupon.applicableTicketTypeIds?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {coupon.applicableTicketTypeIds.map((ticketType) => (
                      <span
                        key={ticketType._id}
                        className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                      >
                        {ticketType.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
