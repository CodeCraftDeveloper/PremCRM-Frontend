import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ListSkeleton } from "../../components/ui";
import {
  ModuleListView,
  useModuleData,
} from "../../components/crm/CrmModuleViews";
import { CRM_MODULES } from "./crmConfig";
import { fetchModuleList } from "../../store/slices/crm/crmSlice";
import { fetchMarketingUsers } from "../../store/slices/usersSlice";
import { fetchModuleMetadata } from "../../store/slices/crm/metadataSlice";

const CrmModulePage = () => {
  const { module } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [drawerState, setDrawerState] = useState({ open: false, item: null });
  const [deleteState, setDeleteState] = useState({ open: false, item: null });
  const [filterExpanded, setFilterExpanded] = useState(false);
  const lastQueryKeyRef = useRef("");
  const marketingUsers = useSelector((state) => state.users.marketingUsers);

  // useModuleData must be called unconditionally (rules of hooks).
  // Guard all property accesses with optional chaining so an unknown module
  // param never throws before the fallback UI is rendered below.
  const { moduleState } = useModuleData(module);

  const basePath = location.pathname.startsWith("/admin")
    ? "/admin/crm"
    : "/marketing/crm";

  const paginationPage = moduleState?.pagination?.page ?? 1;
  const paginationLimit = moduleState?.pagination?.limit ?? 20;
  const filters = useMemo(
    () => moduleState?.filters ?? {},
    [moduleState?.filters],
  );

  useEffect(() => {
    if (!CRM_MODULES[module]) return;
    const queryKey = JSON.stringify({
      module,
      page: paginationPage,
      limit: paginationLimit,
      filters,
    });
    if (lastQueryKeyRef.current === queryKey) return;
    lastQueryKeyRef.current = queryKey;

    dispatch(fetchModuleMetadata(module));
    dispatch(
      fetchModuleList({
        module,
        params: {
          page: paginationPage,
          limit: paginationLimit,
          ...filters,
        },
      }),
    );
  }, [dispatch, module, paginationPage, paginationLimit, filters]);

  useEffect(() => {
    if (!CRM_MODULES[module]) return;
    if (!marketingUsers?.length) {
      dispatch(fetchMarketingUsers());
    }
  }, [dispatch, module, marketingUsers?.length]);

  // Redirect invalid module params to 404 route.
  useEffect(() => {
    if (!CRM_MODULES[module]) {
      navigate("/404", { replace: true });
    }
  }, [module, navigate]);

  if (!CRM_MODULES[module]) {
    return null;
  }

  if (moduleState?.loading && (moduleState?.items?.length ?? 0) === 0) {
    return <ListSkeleton />;
  }

  return (
    <ModuleListView
      module={module}
      basePath={basePath}
      onNavigate={navigate}
      drawerState={drawerState}
      setDrawerState={setDrawerState}
      deleteState={deleteState}
      setDeleteState={setDeleteState}
      filterExpanded={filterExpanded}
      setFilterExpanded={setFilterExpanded}
    />
  );
};

export default CrmModulePage;
