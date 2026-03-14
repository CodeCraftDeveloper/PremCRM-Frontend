import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Ticket,
  Users,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import api from "../../services/api";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: 0,
  currency: "INR",
  capacity: "",
  waitlistEnabled: false,
  saleStartDate: "",
  saleEndDate: "",
  perOrderMin: 1,
  perOrderMax: 10,
};

export default function TicketTypesPage({ isAdmin = true }) {
  const { id: eventId } = useParams();
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: EMPTY_FORM,
  });

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/events/${eventId}/ticket-types`)
      .then((r) => setTicketTypes(r.data.data.ticketTypes))
      .catch(() => toast.error("Failed to load ticket types"))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    reset(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (tt) => {
    setEditing(tt);
    reset({
      name: tt.name,
      description: tt.description || "",
      price: tt.price,
      currency: tt.currency,
      capacity: tt.capacity ?? "",
      waitlistEnabled: tt.waitlistEnabled,
      saleStartDate: tt.saleStartDate ? tt.saleStartDate.slice(0, 16) : "",
      saleEndDate: tt.saleEndDate ? tt.saleEndDate.slice(0, 16) : "",
      perOrderMin: tt.perOrderMin,
      perOrderMax: tt.perOrderMax,
    });
    setShowForm(true);
  };

  const onSubmit = async (values) => {
    setSaving(true);
    const payload = {
      ...values,
      price: parseFloat(values.price),
      capacity: values.capacity === "" ? null : parseInt(values.capacity, 10),
      perOrderMin: parseInt(values.perOrderMin, 10),
      perOrderMax: parseInt(values.perOrderMax, 10),
      saleStartDate: values.saleStartDate || null,
      saleEndDate: values.saleEndDate || null,
    };
    try {
      if (editing) {
        await api.put(
          `/events/${eventId}/ticket-types/${editing._id}`,
          payload,
        );
        toast.success("Ticket type updated");
      } else {
        await api.post(`/events/${eventId}/ticket-types`, payload);
        toast.success("Ticket type created");
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tt) => {
    if (!window.confirm(`Delete "${tt.name}"?`)) return;
    try {
      await api.delete(`/events/${eventId}/ticket-types/${tt._id}`);
      toast.success("Ticket type deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
          <Ticket className="h-5 w-5 text-blue-400" />
          Ticket Types
        </h2>
        {isAdmin && (
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Ticket Type
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-slate-400">Loading…</div>
      ) : ticketTypes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 py-12 text-center text-slate-500">
          No ticket types yet.{" "}
          {isAdmin && (
            <button onClick={openNew} className="text-blue-400 hover:underline">
              Create one
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {ticketTypes.map((tt) => (
            <div
              key={tt._id}
              className="rounded-xl border border-slate-700 bg-slate-900 p-5 flex items-start justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-white">{tt.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      tt.status === "active"
                        ? "bg-green-900/30 text-green-300"
                        : tt.status === "sold_out"
                          ? "bg-rose-900/30 text-rose-300"
                          : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {tt.status}
                  </span>
                  {tt.waitlistEnabled && (
                    <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded-full">
                      Waitlist
                    </span>
                  )}
                </div>
                {tt.description && (
                  <p className="text-sm text-slate-400">{tt.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-300">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {tt.price === 0
                      ? "Free"
                      : `${tt.currency} ${tt.price.toLocaleString()}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {tt.sold} sold
                    {tt.capacity != null ? ` / ${tt.capacity}` : " (unlimited)"}
                  </span>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(tt)}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tt)}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Slide-in form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editing ? "Edit Ticket Type" : "New Ticket Type"}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Name *
                </label>
                <input
                  {...register("name", { required: "Name is required" })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-blue-500"
                  placeholder="General Admission"
                />
                {errors.name && (
                  <p className="text-xs text-rose-400 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={2}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Price *
                  </label>
                  <input
                    {...register("price", { required: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Currency
                  </label>
                  <input
                    {...register("currency")}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-blue-500"
                    maxLength={3}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Capacity (leave blank for unlimited)
                </label>
                <input
                  {...register("capacity")}
                  type="number"
                  min="1"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-blue-500"
                  placeholder="e.g. 100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Min per order
                  </label>
                  <input
                    {...register("perOrderMin")}
                    type="number"
                    min="1"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Max per order
                  </label>
                  <input
                    {...register("perOrderMax")}
                    type="number"
                    min="1"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Sale Start
                  </label>
                  <input
                    {...register("saleStartDate")}
                    type="datetime-local"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Sale End
                  </label>
                  <input
                    {...register("saleEndDate")}
                    type="datetime-local"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register("waitlistEnabled")}
                  type="checkbox"
                  className="rounded"
                />
                <span className="text-sm text-slate-300">
                  Enable waitlist when sold out
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 transition-colors"
                >
                  {saving ? "Saving…" : editing ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-slate-600 hover:border-slate-400 text-slate-300 font-semibold py-2.5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
