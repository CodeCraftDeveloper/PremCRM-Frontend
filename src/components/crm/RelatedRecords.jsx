import { Link } from "react-router-dom";
import {
  Building2,
  Briefcase,
  Users,
  Target,
  ExternalLink,
} from "lucide-react";

const RELATION_MAP = {
  leads: [
    {
      key: "account",
      module: "accounts",
      label: "Account",
      icon: Building2,
      idField: "account",
    },
  ],
  contacts: [
    {
      key: "account",
      module: "accounts",
      label: "Account",
      icon: Building2,
      idField: "account",
    },
  ],
  accounts: [
    { key: "contacts", label: "Contacts", icon: Users },
    { key: "deals", label: "Deals", icon: Briefcase },
  ],
  deals: [
    {
      key: "account",
      module: "accounts",
      label: "Account",
      icon: Building2,
      idField: "account",
    },
    {
      key: "contact",
      module: "contacts",
      label: "Contact",
      icon: Users,
      idField: "contact",
    },
  ],
  activities: [{ key: "relatedTo", label: "Related Entity", icon: Target }],
};

const RelatedRecords = ({ module, detail, basePath }) => {
  const relations = RELATION_MAP[module] || [];

  if (relations.length === 0) return null;

  const getRelatedItems = (relation) => {
    if (relation.idField) {
      // Single linked record (e.g., deal.account)
      const ref = detail[relation.idField];
      if (!ref) return [];
      if (typeof ref === "object" && ref._id) {
        return [
          {
            _id: ref._id,
            name: ref.name || ref.fullName || ref._id,
            module: relation.module,
          },
        ];
      }
      if (typeof ref === "string") {
        return [{ _id: ref, name: ref, module: relation.module }];
      }
      return [];
    }

    // Array of related records (e.g., account.contacts)
    const items = detail[relation.key];
    if (Array.isArray(items)) {
      return items.slice(0, 5).map((item) => ({
        _id: item._id || item,
        name: item.name || item.fullName || item.subject || item._id || item,
        module: relation.key,
      }));
    }

    // relatedTo object on activities
    if (relation.key === "relatedTo" && detail.relatedTo) {
      const rt = detail.relatedTo;
      return [
        {
          _id: rt.entityId,
          name: `${rt.entityType} — ${rt.entityId}`,
          module: `${rt.entityType}s`,
        },
      ];
    }

    return [];
  };

  return (
    <div className="space-y-4">
      {relations.map((relation) => {
        const Icon = relation.icon;
        const items = getRelatedItems(relation);

        return (
          <div
            key={relation.key}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <Icon className="h-4 w-4 text-gray-400" />
              {relation.label}
              {items.length > 0 && (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  {items.length}
                </span>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                No linked {relation.label.toLowerCase()}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item._id}>
                    <Link
                      to={`${basePath}/${item.module}/${item._id}`}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <span className="truncate">{item.name}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RelatedRecords;
