import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchChannels,
  fetchSummary,
  setFilters,
} from "../../store/slices/inboxSlice";
import {
  Facebook,
  Filter,
  Hash,
  Inbox,
  Mail,
  MapPin,
  MessageSquare,
  RotateCw,
} from "lucide-react";

const CHANNEL_ICONS = {
  gmail: Mail,
  whatsapp: MessageSquare,
  meta: Facebook,
  gmb: MapPin,
};

const STATUS_TABS = [
  { key: null, label: "All" },
  { key: "open", label: "Open" },
  { key: "snoozed", label: "Snoozed" },
  { key: "closed", label: "Closed" },
];

const PROVIDER_LABELS = {
  gmail: "Gmail",
  whatsapp: "WhatsApp",
  meta: "Meta",
  gmb: "Google Business",
};

export default function ChannelSidebar() {
  const dispatch = useDispatch();
  const { summary, summaryLoading, channels, channelsLoading, filters } =
    useSelector((state) => state.inbox);

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchChannels());
  }, [dispatch]);

  const refresh = () => {
    dispatch(fetchSummary());
    dispatch(fetchChannels());
  };

  const handleStatusFilter = (status) => {
    dispatch(setFilters({ status }));
  };

  const handleChannelFilter = (channel) => {
    dispatch(setFilters({ channel: filters.channel === channel ? null : channel }));
  };

  const totalCount = Object.values(summary?.byStatus || {}).reduce(
    (sum, value) => sum + Number(value || 0),
    0,
  );

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100">
          <Inbox className="h-4 w-4 text-blue-500" />
          Inbox
        </h2>
        <button
          type="button"
          onClick={refresh}
          className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          title="Refresh inbox"
        >
          <RotateCw
            className={`h-3.5 w-3.5 ${summaryLoading || channelsLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="border-b border-gray-200 px-3 py-3 dark:border-gray-700">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Summary
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {STATUS_TABS.map((tab) => {
            const count = tab.key ? summary?.byStatus?.[tab.key] || 0 : totalCount;
            const active = filters.status === tab.key;

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => handleStatusFilter(tab.key)}
                className={`rounded-lg px-2 py-1.5 text-left transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <span className="block text-lg font-bold leading-tight">{count}</span>
                <span className="text-[10px] font-medium uppercase">{tab.label}</span>
              </button>
            );
          })}
        </div>
        {summary?.totalUnread > 0 && (
          <div className="mt-2 rounded-lg bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600 dark:bg-orange-900/30 dark:text-orange-300">
            {summary.totalUnread} unread
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          <Filter className="h-3 w-3" />
          Channels
        </p>
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => dispatch(setFilters({ channel: null }))}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                !filters.channel
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              <Hash className="h-3.5 w-3.5" />
              All Channels
            </button>
          </li>
          {channels.map((channel) => {
            const Icon = CHANNEL_ICONS[channel.provider] || Mail;
            const active = filters.channel === channel.provider;
            const label =
              channel.displayName ||
              channel.providerAccountId ||
              PROVIDER_LABELS[channel.provider] ||
              channel.provider;

            return (
              <li key={channel._id}>
                <button
                  type="button"
                  onClick={() => handleChannelFilter(channel.provider)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="truncate">{label}</span>
                  {channel.status === "connected" && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              </li>
            );
          })}
          {channels.length === 0 && !channelsLoading && (
            <li className="py-4 text-center text-xs text-gray-400">
              No channels connected
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}
