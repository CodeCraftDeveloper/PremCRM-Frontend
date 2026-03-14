import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle,
  Calendar,
  MapPin,
  ArrowLeft,
  Sparkles,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import QRCode from "react-qr-code";
import { buildApiUrl } from "../../services/api";
import { publicEventService } from "../../services";
import toast from "react-hot-toast";
import { printEventBadge } from "./badgeUtils";

export default function RegistrationConfirmationPage() {
  const { qrToken } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadRegistration = async () => {
      try {
        const response =
          await publicEventService.getRegistrationByQrToken(qrToken);
        if (isActive) {
          setData(response.data);
        }
      } catch {
        if (isActive) {
          toast.error("Could not load registration");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadRegistration();

    return () => {
      isActive = false;
    };
  }, [qrToken]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-400 gap-4">
        <p>Registration not found.</p>
        <Link to="/" className="text-blue-400 hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  const registration = data.registration;
  const event = registration.eventId;
  const ticket = registration.ticketTypeId;
  const tenant = data.tenant;
  const tenantLogoSrc = tenant?.logoUrl ? buildApiUrl(tenant.logoUrl) : null;

  const printBadge = () => {
    const printed = printEventBadge({
      attendeeName:
        `${registration.attendee?.firstName || ""} ${registration.attendee?.lastName || ""}`.trim(),
      attendeeEmail: registration.attendee?.email,
      eventName: event?.name,
      tenantName: tenant?.companyName,
      ticketName: ticket?.name,
      registrationNumber: registration.registrationNumber,
      qrValue: qrToken,
      quantity: registration.quantity,
      accentColor: tenant?.publicEventLanding?.accentColor || "#10b981",
    });

    if (!printed) {
      toast.error("Popup blocked. Please allow popups to print your badge.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_42%,#111827_100%)] px-4 py-12 text-slate-100">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          {tenant ? (
            <Link
              to={`/events/${tenant.slug}`}
              className="inline-flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to events
            </Link>
          ) : (
            <span />
          )}
          {tenantLogoSrc ? (
            <img
              src={tenantLogoSrc}
              alt={`${tenant.companyName} logo`}
              className="h-11 w-11 rounded-2xl bg-white/95 object-contain p-2 shadow-lg"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-300/25">
              <Sparkles className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="text-center">
          <CheckCircle className="mx-auto h-14 w-14 text-emerald-400" />
          <h1 className="mt-3 text-2xl font-bold text-white">
            You&apos;re Registered!
          </h1>
          <p className="mt-1 text-slate-400">
            Your registration is locked to the {tenant?.companyName || "event"}{" "}
            tenant workspace.
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={printBadge}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20"
          >
            <Printer className="h-4 w-4" />
            Print Badge
          </button>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="flex justify-center bg-white p-6">
            <QRCode value={qrToken} size={180} />
          </div>

          <div className="p-5 space-y-4">
            {tenant && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Tenant
                </p>
                <p className="font-medium text-white">{tenant.companyName}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Registration #
              </p>
              <p className="font-mono font-semibold text-white">
                {registration.registrationNumber}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Attendee
              </p>
              <p className="text-white font-medium">
                {registration.attendee.firstName}{" "}
                {registration.attendee.lastName}
              </p>
              <p className="text-slate-400 text-sm">
                {registration.attendee.email}
              </p>
            </div>

            {event && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Event
                </p>
                <p className="text-white font-medium">{event.name}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-400">
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(event.startDate), "PPP p")}
                  </span>
                </div>
              </div>
            )}

            {ticket && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Ticket
                </p>
                <p className="text-white">
                  {ticket.name} × {registration.quantity}
                </p>
                {registration.discountAmount > 0 && registration.couponCode && (
                  <p className="text-slate-400 text-sm">
                    Coupon {registration.couponCode} applied
                  </p>
                )}
                {registration.discountAmount > 0 && (
                  <p className="text-emerald-300 text-sm">
                    Discount: {registration.currency}{" "}
                    {registration.discountAmount.toLocaleString()}
                  </p>
                )}
                <p className="text-slate-400 text-sm">
                  {registration.totalAmount === 0
                    ? "Free"
                    : `${registration.currency} ${registration.totalAmount.toLocaleString()}`}
                </p>
              </div>
            )}

            {registration.customFields &&
              Object.keys(registration.customFields).length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Additional Details
                  </p>
                  <div className="mt-2 space-y-1.5 text-sm">
                    {Object.entries(registration.customFields).map(
                      ([key, value]) => (
                        <div key={key} className="flex justify-between gap-4">
                          <span className="text-slate-400">{key}</span>
                          <span className="text-right text-slate-200">
                            {String(value)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            <div className="flex items-center gap-2 pt-1">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  registration.status === "confirmed"
                    ? "bg-green-900/40 text-green-300"
                    : registration.status === "checked_in"
                      ? "bg-blue-900/40 text-blue-300"
                      : "bg-slate-700 text-slate-300"
                }`}
              >
                {registration.status.replace("_", " ")}
              </span>
              {registration.paymentStatus !== "free" && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    registration.paymentStatus === "paid"
                      ? "bg-green-900/40 text-green-300"
                      : "bg-amber-900/40 text-amber-300"
                  }`}
                >
                  {registration.paymentStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Save this page or a screenshot of the QR code for event entry.
        </p>
      </div>
    </div>
  );
}
