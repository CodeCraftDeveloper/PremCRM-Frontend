import {
  UserPlus,
  Contact,
  Building2,
  HandCoins,
  ClipboardList,
} from "lucide-react";

export const CRM_MODULES = {
  leads: {
    label: "Leads",
    singular: "Lead",
    path: "leads",
    icon: UserPlus,
    color: "blue",
    nameKey: "fullName",
    statusOptions: [
      { value: "new", label: "New" },
      { value: "contacted", label: "Contacted" },
      { value: "qualified", label: "Qualified" },
      { value: "closed", label: "Closed" },
    ],
    quickFilters: [
      { label: "New", filter: { status: "new" } },
      { label: "Qualified", filter: { status: "qualified" } },
      { label: "My Leads", filter: { mine: true } },
    ],
    columns: [
      { key: "fullName", label: "Name", sortable: true },
      { key: "email", label: "Email", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { key: "assignedTo.name", label: "Assigned To", sortable: false },
      {
        key: "createdAt",
        label: "Created",
        sortable: true,
        render: (value) => (value ? new Date(value).toLocaleDateString() : "-"),
      },
    ],
    fields: [
      { name: "firstName", label: "First Name", isRequired: true },
      { name: "lastName", label: "Last Name" },
      { name: "email", label: "Email", type: "email", isRequired: true },
      { name: "phone", label: "Phone" },
      {
        name: "status",
        label: "Status",
        type: "select",
        optionsKey: "status",
      },
      {
        name: "assignedTo",
        label: "Assigned To",
        type: "select",
        optionsKey: "owners",
      },
      {
        name: "notes",
        label: "Notes",
        type: "textarea",
        fullWidth: true,
      },
    ],
  },
  contacts: {
    label: "Contacts",
    singular: "Contact",
    path: "contacts",
    icon: Contact,
    color: "teal",
    nameKey: "fullName",
    statusOptions: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
    quickFilters: [
      { label: "Active", filter: { status: "active" } },
      { label: "My Contacts", filter: { mine: true } },
    ],
    columns: [
      { key: "fullName", label: "Name", sortable: true },
      { key: "email", label: "Email", sortable: true },
      { key: "phone", label: "Phone", sortable: false },
      { key: "accountId.name", label: "Account", sortable: false },
      { key: "ownerId.name", label: "Owner", sortable: false },
      {
        key: "closingDate",
        label: "Closing Date",
        sortable: true,
        render: (value) => (value ? new Date(value).toLocaleDateString() : "—"),
      },
    ],
    fields: [
      { name: "firstName", label: "First Name", isRequired: true },
      { name: "lastName", label: "Last Name" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone" },
      {
        name: "ownerId",
        label: "Owner",
        type: "select",
        optionsKey: "owners",
        isRequired: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        fullWidth: true,
      },
    ],
  },
  accounts: {
    label: "Accounts",
    singular: "Account",
    path: "accounts",
    icon: Building2,
    color: "violet",
    nameKey: "name",
    statusOptions: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
    quickFilters: [{ label: "Active", filter: { status: "active" } }],
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "industry", label: "Industry", sortable: true },
      { key: "website", label: "Website", sortable: false },
      { key: "ownerId.name", label: "Owner", sortable: false },
      {
        key: "createdAt",
        label: "Created",
        sortable: true,
        render: (value) => (value ? new Date(value).toLocaleDateString() : "-"),
      },
    ],
    fields: [
      { name: "name", label: "Account Name", isRequired: true },
      { name: "industry", label: "Industry" },
      { name: "website", label: "Website" },
      { name: "phone", label: "Phone" },
      {
        name: "ownerId",
        label: "Owner",
        type: "select",
        optionsKey: "owners",
        isRequired: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        fullWidth: true,
      },
    ],
  },
  deals: {
    label: "Deals",
    singular: "Deal",
    path: "deals",
    icon: HandCoins,
    color: "emerald",
    nameKey: "name",
    statusOptions: [
      { value: "open", label: "Open" },
      { value: "won", label: "Won" },
      { value: "lost", label: "Lost" },
    ],
    quickFilters: [
      { label: "Open", filter: { status: "open" } },
      { label: "Won", filter: { status: "won" } },
      { label: "My Deals", filter: { mine: true } },
    ],
    columns: [
      { key: "name", label: "Name", sortable: true },
      {
        key: "amount",
        label: "Amount",
        sortable: true,
        render: (value) =>
          typeof value === "number" ? `$${value.toLocaleString()}` : "-",
      },
      { key: "stage", label: "Stage", sortable: true },
      { key: "probability", label: "Probability", sortable: true },
      { key: "ownerId.name", label: "Owner", sortable: false },
    ],
    fields: [
      { name: "name", label: "Deal Name", isRequired: true },
      { name: "amount", label: "Amount", type: "number" },
      { name: "closingDate", label: "Closing Date", type: "date" },
      {
        name: "stage",
        label: "Stage",
        type: "select",
        optionsKey: "status",
      },
      {
        name: "ownerId",
        label: "Owner",
        type: "select",
        optionsKey: "owners",
        isRequired: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        fullWidth: true,
      },
    ],
  },
  activities: {
    label: "Activities",
    singular: "Activity",
    path: "activities",
    icon: ClipboardList,
    color: "amber",
    nameKey: "subject",
    statusOptions: [
      { value: "planned", label: "Pending" },
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ],
    activityTypeOptions: [
      { value: "task", label: "Task" },
      { value: "call", label: "Call" },
      { value: "meeting", label: "Meeting" },
      { value: "email", label: "Email" },
    ],
    quickFilters: [
      { label: "Pending", filter: { status: "planned" } },
      { label: "Overdue", filter: { overdue: true } },
      { label: "My Activities", filter: { mine: true } },
    ],
    columns: [
      { key: "subject", label: "Subject", sortable: true },
      { key: "type", label: "Type", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { key: "ownerId.name", label: "Owner", sortable: false },
      {
        key: "dueDate",
        label: "Due Date",
        sortable: true,
        render: (value) => (value ? new Date(value).toLocaleDateString() : "-"),
      },
    ],
    fields: [
      { name: "subject", label: "Subject", isRequired: true },
      {
        name: "type",
        label: "Type",
        type: "select",
        optionsKey: "activityType",
        isRequired: true,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        optionsKey: "status",
      },
      { name: "dueDate", label: "Due Date", type: "date" },
      {
        name: "ownerId",
        label: "Owner",
        type: "select",
        optionsKey: "owners",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        fullWidth: true,
      },
    ],
  },
};

export const CRM_MODULE_OPTIONS = Object.entries(CRM_MODULES).map(
  ([value, module]) => ({ value, label: module.label }),
);

/**
 * Get the display name of a CRM record.
 */
export const getRecordName = (module, record) => {
  if (!record) return "—";
  const config = CRM_MODULES[module];
  if (!config) return record.name || record.fullName || record.subject || "—";
  return record[config.nameKey] || "—";
};

