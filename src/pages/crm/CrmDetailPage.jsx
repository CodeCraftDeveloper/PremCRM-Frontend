import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ModuleDetailView } from "../../components/crm/CrmModuleViews";
import { CRM_MODULES } from "./crmConfig";

const CrmDetailPage = () => {
  const { module, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  if (!CRM_MODULES[module]) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        Invalid CRM module.
      </div>
    );
  }

  const basePath = location.pathname.startsWith("/admin")
    ? "/admin/crm"
    : "/marketing/crm";

  return (
    <ModuleDetailView
      module={module}
      id={id}
      navigate={navigate}
      basePath={basePath}
      onBack={() => navigate(`${basePath}/${module}`)}
    />
  );
};

export default CrmDetailPage;
