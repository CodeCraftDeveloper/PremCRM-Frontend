import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  Users,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { buildApiUrl } from "../../services/api";
import { publicEventService } from "../../services";
import toast from "react-hot-toast";

const schema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().max(50).optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  quantity: z.coerce.number().int().min(1).max(20),
  couponCode: z.string().max(32).optional(),
  notes: z.string().max(2000).optional(),
});

const isSaleActive = (tt) => {
  const now = new Date();
  if (tt.saleStartDate && new Date(tt.saleStartDate) > now) return false;
  if (tt.saleEndDate && new Date(tt.saleEndDate) < now) return false;
  return true;
};

export default function PublicEventDetailPage() {
  const { tenantSlug, eventId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTt, setSelectedTt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [waitlistTt, setWaitlistTt] = useState(null);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [customFieldErrors, setCustomFieldErrors] = useState({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  });

  const qty = parseInt(watch("quantity") || 1, 10);

  useEffect(() => {
    let isActive = true;

    const loadEvent = async () => {
      try {
        const response = await publicEventService.getEvent(tenantSlug, eventId);
        if (isActive) {
          setData(response.data);
        }
      } catch {
        if (isActive) {
          toast.error("Could not load event");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadEvent();

    return () => {
      isActive = false;
    };
  }, [tenantSlug, eventId]);

  const onSubmit = async (values) => {
    if (!selectedTt) return;
    setSubmitting(true);

    const normalizedCustomFields = {};
    const nextCustomErrors = {};
    const eventFields = Array.isArray(data?.event?.registrationFields)
      ? [...data.event.registrationFields].sort(
          (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
        )
      : [];

    for (const field of eventFields) {
      const key = field?.key;
      if (!key) continue;

      const raw = customFieldValues[key];
      const value = typeof raw === "string" ? raw.trim() : raw;
      const hasValue =
        value !== undefined && value !== null && String(value) !== "";

      if (field.required && !hasValue) {
        nextCustomErrors[key] = `${field.label || key} is required`;
        continue;
      }

      if (!hasValue) continue;

      if (field.type === "number") {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
          nextCustomErrors[key] = `${field.label || key} must be a number`;
          continue;
        }
        normalizedCustomFields[key] = parsed;
        continue;
      }

      if (field.type === "url") {
        try {
          const parsedUrl = new URL(String(value));
          if (!parsedUrl.hostname) {
            throw new Error("Invalid URL");
          }
        } catch {
          nextCustomErrors[key] = `${field.label || key} must be a valid URL`;
          continue;
        }
      }

      normalizedCustomFields[key] = value;
    }

    if (Object.keys(nextCustomErrors).length) {
      setCustomFieldErrors(nextCustomErrors);
      setSubmitting(false);
      return;
    }

    setCustomFieldErrors({});

    try {
      const res = await publicEventService.register(tenantSlug, eventId, {
        ticketTypeId: selectedTt._id,
        quantity: values.quantity,
        attendee: {
          firstName: values.firstName,
          lastName: values.lastName || "",
          email: values.email,
          phone: values.phone || "",
          company: values.company || "",
        },
        notes: values.notes || "",
        customFields: normalizedCustomFields,
        couponCode: values.couponCode?.trim() || undefined,
      });
      toast.success("Registration successful!");
      navigate(`/registration-confirmation/${res.data.registration.qrToken}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onWaitlist = async (values) => {
    if (!waitlistTt) return;
    setWaitlistSubmitting(true);
    try {
      await publicEventService.joinWaitlist(
        tenantSlug,
        eventId,
        waitlistTt._id,
        {
          attendee: {
            firstName: values.firstName,
            lastName: values.lastName || "",
            email: values.email,
            phone: values.phone || "",
          },
        },
      );
      toast.success("Added to waitlist!");
      setWaitlistTt(null);
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not join waitlist");
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Event not found
      </div>
    );
  }

  const { event, ticketTypes, tenant } = data;
  const isFormMode = selectedTt || waitlistTt;
  const activeTt = selectedTt || waitlistTt;
  const isWaitlistMode = !!waitlistTt;
  const tenantLogoSrc = tenant?.logoUrl ? buildApiUrl(tenant.logoUrl) : null;
  const tenantLanding = tenant?.publicEventLanding || {};
  const eventLanding = event?.landing || {};
  const heroImage =
    eventLanding.heroImageUrl || tenantLanding.heroImageUrl || event.image;
  const heroTagline =
    eventLanding.heroTagline || tenantLanding.heroTagline || event.description;
  const accentColor =
    eventLanding.accentColor || tenantLanding.accentColor || "#06b6d4";
  const registrationFields = Array.isArray(event.registrationFields)
    ? [...event.registrationFields].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
      )
    : [];

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_40%,#111827_100%)] text-slate-100">
      <div className="relative border-b border-white/10">
        {heroImage && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/92 to-cyan-950/65" />

        <div className="relative mx-auto max-w-6xl px-4 py-10">
          <Link
            to={`/events/${tenant.slug}`}
            className="inline-flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {tenant.companyName} events
          </Link>

          <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-3">
                {tenantLogoSrc ? (
                  <img
                    src={tenantLogoSrc}
                    alt={`${tenant.companyName} logo`}
                    className="h-14 w-14 rounded-2xl bg-white/95 object-contain p-2 shadow-lg"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-300/25">
                    <Sparkles className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                    Hosted by {tenant.companyName}
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                    {event.name}
                  </h1>
                </div>
              </div>

              {heroTagline && (
                <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                  {heroTagline}
                </p>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm md:min-w-72">
              <div className="space-y-3 text-sm text-slate-200">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-300" />
                  <span>
                    {format(new Date(event.startDate), "PPP p")} to{" "}
                    {format(new Date(event.endDate), "PPP p")}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-300" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          {heroImage && (
            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
              <img
                src={heroImage}
                alt={event.name}
                className="h-72 w-full object-cover"
              />
            </div>
          )}

          {!isFormMode && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold text-white">
                  Choose a ticket
                </h2>
              </div>

              {ticketTypes.length === 0 && (
                <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center text-slate-400">
                  No tickets are available for this tenant event yet.
                </div>
              )}

              {ticketTypes.map((tt) => {
                const saleActive = isSaleActive(tt);
                const canRegister =
                  !tt.isSoldOut && saleActive && tt.status !== "paused";
                const showWaitlist =
                  (tt.isSoldOut || !saleActive) && tt.waitlistEnabled;

                return (
                  <div
                    key={tt._id}
                    className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            {tt.name}
                          </h3>
                          {tt.description && (
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {tt.description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                          <span className="rounded-full bg-cyan-500/12 px-3 py-1 font-semibold text-cyan-200">
                            {tt.price === 0
                              ? "Free"
                              : `${tt.currency} ${tt.price.toLocaleString()}`}
                          </span>
                          {tt.available !== null && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                              <Users className="h-4 w-4 text-cyan-300" />
                              {tt.available} remaining
                            </span>
                          )}
                        </div>

                        {tt.isSoldOut && (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-400">
                            <AlertTriangle className="h-3 w-3" />
                            Sold out
                          </span>
                        )}

                        {!saleActive && !tt.isSoldOut && tt.saleStartDate && (
                          <p className="text-xs text-amber-400">
                            Sales open on{" "}
                            {format(new Date(tt.saleStartDate), "PPP")}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 space-y-2 md:min-w-44">
                        {canRegister && (
                          <button
                            onClick={() => {
                              setSelectedTt(tt);
                              setCustomFieldErrors({});
                              setCustomFieldValues({});
                              reset({ quantity: 1 });
                            }}
                            className="block w-full rounded-xl px-4 py-3 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90"
                            style={{ backgroundColor: accentColor }}
                          >
                            Register now
                          </button>
                        )}
                        {showWaitlist && (
                          <button
                            onClick={() => {
                              setWaitlistTt(tt);
                              setCustomFieldErrors({});
                              setCustomFieldValues({});
                              reset({});
                            }}
                            className="block w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-cyan-300/50 hover:text-white"
                          >
                            Join waitlist
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {isFormMode && (
          <div className="h-fit rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">
                {isWaitlistMode ? "Join Waitlist" : "Register"} ·{" "}
                {activeTt.name}
              </h2>
              <button
                onClick={() => {
                  setSelectedTt(null);
                  setWaitlistTt(null);
                  reset();
                }}
                className="text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={handleSubmit(isWaitlistMode ? onWaitlist : onSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    First Name *
                  </label>
                  <input
                    {...register("firstName")}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                    placeholder="Jane"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-rose-400">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Last Name
                  </label>
                  <input
                    {...register("lastName")}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Email *
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                  placeholder="jane@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Phone
                  </label>
                  <input
                    {...register("phone")}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                    placeholder="+91 98765 43210"
                  />
                </div>
                {!isWaitlistMode && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Company
                    </label>
                    <input
                      {...register("company")}
                      className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                      placeholder="Acme Corp"
                    />
                  </div>
                )}
              </div>

              {!isWaitlistMode && (
                <>
                  {registrationFields.length > 0 && (
                    <div className="space-y-4 rounded-xl border border-white/10 bg-slate-900/60 p-4">
                      <p className="text-sm font-medium text-white">
                        Additional Registration Fields
                      </p>
                      {registrationFields.map((field) => {
                        const value = customFieldValues[field.key] || "";
                        const error = customFieldErrors[field.key];

                        return (
                          <div key={field.key}>
                            <label className="mb-1 block text-sm text-slate-400">
                              {field.label}
                              {field.required ? " *" : ""}
                            </label>

                            {field.type === "textarea" ? (
                              <textarea
                                value={value}
                                rows={3}
                                maxLength={field.maxLength || undefined}
                                placeholder={field.placeholder || ""}
                                onChange={(e) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                              />
                            ) : field.type === "select" ? (
                              <select
                                value={value}
                                onChange={(e) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-white outline-none focus:border-cyan-400"
                              >
                                <option value="">Select an option</option>
                                {(field.options || []).map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={
                                  field.type === "number"
                                    ? "number"
                                    : field.type === "date"
                                      ? "date"
                                      : field.type === "url"
                                        ? "url"
                                        : "text"
                                }
                                value={value}
                                maxLength={field.maxLength || undefined}
                                placeholder={field.placeholder || ""}
                                onChange={(e) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                              />
                            )}

                            {field.helpText && (
                              <p className="mt-1 text-xs text-slate-500">
                                {field.helpText}
                              </p>
                            )}
                            {error && (
                              <p className="mt-1 text-xs text-rose-400">
                                {error}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Quantity (max {activeTt.perOrderMax})
                    </label>
                    <input
                      {...register("quantity")}
                      type="number"
                      min={activeTt.perOrderMin}
                      max={activeTt.perOrderMax}
                      className="w-24 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                    {errors.quantity && (
                      <p className="mt-1 text-xs text-rose-400">
                        {errors.quantity.message}
                      </p>
                    )}
                  </div>

                  {activeTt.price > 0 && (
                    <div className="rounded-xl bg-slate-900/80 px-4 py-3 text-sm ring-1 ring-white/10">
                      <span className="text-slate-400">Total: </span>
                      <span className="font-bold text-white">
                        {activeTt.currency}{" "}
                        {(activeTt.price * qty).toLocaleString()}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">
                        Coupon codes are validated when you confirm
                        registration.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Coupon Code
                    </label>
                    <input
                      {...register("couponCode")}
                      className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 uppercase text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                      placeholder="EARLYBIRD"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Notes
                    </label>
                    <textarea
                      {...register("notes")}
                      rows={2}
                      className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                      placeholder="Any special requirements..."
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting || waitlistSubmitting}
                className="w-full rounded-xl py-3 font-semibold text-slate-950 transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {submitting || waitlistSubmitting
                  ? "Submitting…"
                  : isWaitlistMode
                    ? "Join Waitlist"
                    : `Confirm Registration${activeTt.price === 0 ? " (Free)" : ""}`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
