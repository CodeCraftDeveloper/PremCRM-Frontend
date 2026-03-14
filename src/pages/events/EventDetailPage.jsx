import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Target,
  Users,
  TrendingUp,
  Edit,
  Ticket,
  UserCheck,
  ScanLine,
  IndianRupee,
  Percent,
} from "lucide-react";
import { format } from "date-fns";
import { eventRegistrationsService, eventsService } from "../../services";
import { Button, LoadingSpinner, StatusBadge } from "../../components/ui";
import DomainOperationsPanel from "./DomainOperationsPanel";
import EventCouponsPanel from "./EventCouponsPanel";
import toast from "react-hot-toast";

const EventDetailPage = ({ isAdmin = true }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const basePath = isAdmin ? "/admin" : "/marketing";

  const [isLoading, setIsLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [registrationStats, setRegistrationStats] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadEventData = async () => {
      setIsLoading(true);
      try {
        const [eventRes, statsRes] = await Promise.all([
          eventsService.getOne(id),
          eventsService.getStats(id),
        ]);

        const registrationStatsRes =
          await eventRegistrationsService.getStats(id);

        if (!isMounted) return;

        setEventData(eventRes.data || null);
        setStatsData(statsRes.data || null);
        setRegistrationStats(registrationStatsRes.data || null);
      } catch (error) {
        if (!isMounted) return;
        toast.error(
          error?.response?.data?.message || "Failed to load event details",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadEventData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Loading event details..." />
      </div>
    );
  }

  const event = eventData?.event;
  const clientStats = eventData?.clientStats || {};
  const marketerStats = eventData?.clientsByMarketer || [];
  const eventStats = statsData?.stats || {};
  const dailyTrend = statsData?.dailyTrend || [];
  const attendanceStats = registrationStats || {};
  const totalRegistered = Number(attendanceStats.totalAttendees || 0);
  const checkedInCount = Number(attendanceStats.byStatus?.checked_in || 0);
  const attendanceRate = totalRegistered
    ? ((checkedInCount / totalRegistered) * 100).toFixed(1)
    : "0.0";
  const registrationRevenue = Number(attendanceStats.totalRevenue || 0);
  const seatSummary = attendanceStats.seatSummary || {};
  const waitlistCount = Number(attendanceStats.waitlistCount || 0);
  const conversionRate = Number(
    eventStats.conversionRate || clientStats.conversionRate || 0,
  );
  const conversionToRegistrationRate = totalRegistered
    ? (
        (Number(eventStats.converted || clientStats.converted || 0) /
          totalRegistered) *
        100
      ).toFixed(1)
    : "0.0";
  const budget = Number(event.budget || 0);
  const roi =
    budget > 0
      ? (((registrationRevenue - budget) / budget) * 100).toFixed(1)
      : "0.0";

  if (!event) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Event not found
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          This event may have been deleted or you may not have access to it.
        </p>
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => navigate(`${basePath}/events`)}
          >
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {event.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Event overview and operations
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Link to={`${basePath}/events/${id}/edit`}>
              <Button variant="outline" icon={Edit}>
                Edit Event
              </Button>
            </Link>
          )}
          <Link to={`${basePath}/events/${id}/ticket-types`}>
            <Button variant="outline" icon={Ticket}>
              Ticket Types
            </Button>
          </Link>
          <Link to={`${basePath}/events/${id}/registrations`}>
            <Button variant="outline" icon={Users}>
              Registrations
            </Button>
          </Link>
          <Link to={`${basePath}/events/${id}/checkin`}>
            <Button icon={ScanLine}>Check-In</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={event.status} />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Created by {event.createdBy?.name || "Unknown"}
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              {event.description || "No description provided."}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Location
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <MapPin className="h-4 w-4" />
              {event.location || "N/A"}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Date Range
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <Calendar className="h-4 w-4" />
              {format(new Date(event.startDate), "MMM d, yyyy")} -{" "}
              {format(new Date(event.endDate), "MMM d, yyyy")}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Target Leads
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <Target className="h-4 w-4" />
              {event.targetLeads || 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Budget
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <TrendingUp className="h-4 w-4" />
              {event.budget ? `Rs ${event.budget.toLocaleString()}` : "Not set"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Total Leads
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {eventStats.total || clientStats.total || 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Converted
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {eventStats.converted || clientStats.converted || 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Conversion Rate
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {conversionRate}%
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Pending Follow-Ups
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {eventStats.pending || clientStats.pending || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Attendance
          </p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-emerald-600">
            <Users className="h-5 w-5" />
            {checkedInCount}/{totalRegistered}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {attendanceRate}% checked in
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Registration Revenue
          </p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-indigo-600">
            <IndianRupee className="h-5 w-5" />
            {registrationRevenue.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Conversion to Registration
          </p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-blue-600">
            <Percent className="h-5 w-5" />
            {conversionToRegistrationRate}%
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Converted leads vs registered attendees
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            ROI
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${Number(roi) >= 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            {roi}%
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {(registrationRevenue - budget).toLocaleString()} net vs budget
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Seats Sold
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {seatSummary.sold || 0}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {seatSummary.capacity
              ? `${seatSummary.available || 0} remaining of ${seatSummary.capacity}`
              : "Unlimited capacity across ticket types"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Waitlist Queue
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {waitlistCount}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Active waiting or notified attendees
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Refunded Payments
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-600">
            {attendanceStats.byPaymentStatus?.refunded || 0}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Refund lifecycle events tracked on registrations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Daily Lead Trend
          </h2>
          {dailyTrend.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No trend data available yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {dailyTrend.slice(-10).map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900/40"
                >
                  <span className="text-gray-600 dark:text-gray-300">
                    {item._id}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.count} leads
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Clients by Marketing User
          </h2>
          {marketerStats.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No assignment data available for this event.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {marketerStats.map((marketer) => (
                <div
                  key={marketer.email}
                  className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {marketer.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {marketer.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {marketer.count} total
                      </p>
                      <p className="text-xs text-emerald-600">
                        {marketer.converted} converted
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
        <div className="flex items-start gap-3">
          <UserCheck className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-300">
              Event Operations
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Manage registrations, ticket capacity, and check-ins from the
              action buttons above.
            </p>
          </div>
        </div>
      </div>

      {isAdmin && <EventCouponsPanel eventId={id} />}

      {isAdmin && <DomainOperationsPanel eventId={id} />}
    </div>
  );
};

export default EventDetailPage;
