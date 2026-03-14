import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Calendar, MapPin, Tag, ArrowRight, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { buildApiUrl } from "../../services/api";
import { publicEventService } from "../../services";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export default function PublicEventListPage() {
  const { tenantSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadEvents = async () => {
      try {
        const response = await publicEventService.listEvents(tenantSlug);
        if (isActive) {
          setData(response.data);
        }
      } catch {
        if (isActive) {
          toast.error("Could not load events");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      isActive = false;
    };
  }, [tenantSlug]);

  const tenantLanding = data?.tenant?.publicEventLanding || {};

  const heroImage = useMemo(() => {
    if (tenantLanding.heroImageUrl) return tenantLanding.heroImageUrl;
    return data?.events?.find((event) => event.image)?.image || null;
  }, [data, tenantLanding.heroImageUrl]);

  const tenantLogoSrc = data?.tenant?.logoUrl
    ? buildApiUrl(data.tenant.logoUrl)
    : null;

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
        Events not found
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(21,94,117,0.28),_transparent_38%),linear-gradient(180deg,_#020617_0%,_#0f172a_44%,_#111827_100%)] text-slate-100">
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
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-cyan-950/70" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center gap-3">
              {tenantLogoSrc ? (
                <img
                  src={tenantLogoSrc}
                  alt={`${data.tenant.companyName} logo`}
                  className="h-14 w-14 rounded-2xl bg-white/95 object-contain p-2 shadow-lg"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-300/30">
                  <Sparkles className="h-6 w-6" />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                  Tenant Event Hub
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                  {data.tenant.companyName}
                </h1>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-7 text-slate-300 md:text-base">
              {tenantLanding.heroTagline ||
                `Browse live and upcoming events for ${data.tenant.companyName}. Each registration stays isolated to the ${data.tenant.slug} tenant.`}
            </p>
          </div>

          <div className="grid max-w-sm grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Workspace
              </p>
              <p className="mt-2 font-medium text-white">{data.tenant.slug}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Live Events
              </p>
              <p className="mt-2 font-medium text-white">
                {data.events.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {data.events.length === 0 && (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/5 px-6 py-20 text-center text-slate-400 backdrop-blur-sm">
            No upcoming events at the moment for this tenant.
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.events.map((event) => (
            <Link
              key={event._id}
              to={`/events/${tenantSlug}/${event._id}`}
              className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/7"
            >
              <div className="relative h-48 overflow-hidden border-b border-white/10 bg-slate-900">
                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,_rgba(34,211,238,0.14),_rgba(15,23,42,1))] text-slate-500">
                    <Sparkles className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
                <div className="absolute left-4 bottom-4 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[event.status] ?? "bg-white/10 text-white"}`}
                  >
                    {event.status}
                  </span>
                  {event.tags?.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-3 py-1 text-xs text-slate-200"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {event.name}
                  </h2>
                  {event.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-cyan-300" />
                    <span>{format(new Date(event.startDate), "PPP")}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-cyan-300" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm font-medium text-cyan-200">
                  <span>View details and register</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
