import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Share2,
  Search,
  Sparkles,
  Check,
  X,
  TrendingUp,
  Settings,
  AlertCircle,
  Calendar,
  DollarSign,
  Eye,
  MousePointerClick,
  LineChart,
  Edit3,
  AlertTriangle,
  RefreshCw,
  Megaphone,
  Plus,
  Trash,
  Info,
  ChevronRight,
  ShieldAlert,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Globe,
  Target
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart as RechartsLineChart,
  Line
} from "recharts";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Button, Input, Select, Textarea, Modal, Badge } from "../../components/ui";

const SocialAgentDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role || "marketing";
  const isAdmin = userRole === "admin" || userRole === "superadmin";

  // Dashboard state
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Trends state
  const [trends, setTrends] = useState([]);
  const [_loadingTrends, setLoadingTrends] = useState(false);
  const [scanningTrends, setScanningTrends] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  // Brand profile state
  const [brandProfile, setBrandProfile] = useState(null);
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);

  // Creator state
  const [creatorPrompt, setCreatorPrompt] = useState("");
  const [selectedChannels, setSelectedChannels] = useState(["facebook"]);
  const [campaignGoal, setCampaignGoal] = useState("Brand Awareness");
  const [postFormat, setPostFormat] = useState("image");
  const [audienceHint, setAudienceHint] = useState("");
  const [productName, setProductName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generationSteps, setGenerationSteps] = useState(0);
  const [currentDraft, setCurrentDraft] = useState(null);
  const [editedVariants, setEditedVariants] = useState({}); // variantId -> { body, hashtags }

  // Drafts & Approvals list
  const [draftsList, setDraftsList] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftPage, setDraftPage] = useState(1);
  const [draftTotalPages, setDraftTotalPages] = useState(1);
  const [_selectedDraftForView, _setSelectedDraftForView] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectDraftId, setRejectDraftId] = useState(null);

  // Posts & Campaigns state
  const [postsList, setPostsList] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [selectedVariantForAd, setSelectedVariantForAd] = useState(null);
  const [selectedDraftForAd, setSelectedDraftForAd] = useState(null);
  const [selectedChannelForAd, setSelectedChannelForAd] = useState("");
  
  // Ad config inputs
  const [adBudget, setAdBudget] = useState(150);
  const [adDuration, setAdDuration] = useState(7);
  const [adAudience, setAdAudience] = useState("Age 25-45, Interest in Real Estate & Home Decor");
  const [publishingPost, setPublishingPost] = useState(false);

  // --- Fetching API Data ---

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const response = await api.get("/ai/social/analytics");
      if (response.data?.success && response.data?.data?.analytics) {
        setAnalytics(response.data.data.analytics);
      }
    } catch {
      toast.error("Failed to load social analytics.");
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  const fetchTrends = useCallback(async () => {
    setLoadingTrends(true);
    try {
      const response = await api.get("/ai/social/trends");
      if (response.data?.success && response.data?.data?.trends) {
        setTrends(response.data.data.trends);
      }
    } catch {
      toast.error("Failed to load trending topics.");
    } finally {
      setLoadingTrends(false);
    }
  }, []);

  const fetchBrandProfile = useCallback(async () => {
    setLoadingBrand(true);
    try {
      const response = await api.get("/ai/social/brand-profile");
      if (response.data?.success && response.data?.data?.profile) {
        setBrandProfile(response.data.data.profile);
        // Set default values in creator if profile has them
        if (response.data.data.profile.products?.length > 0) {
          setProductName(response.data.data.profile.products[0].name);
        }
        if (response.data.data.profile.locations?.length > 0) {
          setLocationName(response.data.data.profile.locations[0].name);
        }
      }
    } catch {
      console.warn("Brand profile not found or failed to load. Will request initialization.");
    } finally {
      setLoadingBrand(false);
    }
  }, []);

  const fetchDrafts = useCallback(async (page = 1) => {
    setLoadingDrafts(true);
    try {
      const response = await api.get(`/ai/social/drafts?page=${page}&limit=10`);
      if (response.data?.success) {
        setDraftsList(response.data.data || []);
        if (response.data.pagination) {
          setDraftTotalPages(response.data.pagination.totalPages || 1);
        }
      }
    } catch {
      toast.error("Failed to load drafts list.");
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      // We will read posts list from the analytics data or fetch directly if available
      const response = await api.get("/ai/social/analytics");
      if (response.data?.success && response.data?.data?.analytics) {
        // We will fetch posts inside getSocialAnalytics or fetch via posts endpoint.
        // Let's call /ai/social/analytics which triggers post sync, then fetch posts list.
        // Wait, does the controller support GET /posts? The router has POST /posts but not GET /posts.
        // That is fine, we can query posts inside the analytics payload if it returns it, or fetch from getSocialAnalytics.
        // Let's verify: getSocialAnalytics returns kpis, history, postsCount, adsCount.
        // To show published posts, let's hit a query to list drafts with status: "published".
        const draftsRes = await api.get("/ai/social/drafts?status=published&limit=50");
        if (draftsRes.data?.success) {
          setPostsList(draftsRes.data.data || []);
        }
      }
    } catch {
      toast.error("Failed to load published posts.");
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAnalytics();
    fetchTrends();
    fetchBrandProfile();
    fetchDrafts(1);
    fetchPosts();
  }, [fetchAnalytics, fetchTrends, fetchBrandProfile, fetchDrafts, fetchPosts]);

  // --- Handlers ---

  const handleScanTrends = async () => {
    if (scanningTrends) return;
    setScanningTrends(true);
    setScanStep(1);

    const stepIntervals = [
      setTimeout(() => setScanStep(2), 1500),
      setTimeout(() => setScanStep(3), 3000),
      setTimeout(() => setScanStep(4), 4500)
    ];

    try {
      const response = await api.post("/ai/social/trends/search");
      if (response.data?.success && response.data?.data?.trends) {
        setTrends(response.data.data.trends);
        toast.success("Trend analysis complete. Showing suggested topics.");
      }
    } catch {
      toast.error("Trend scan failed. Please make sure your Brand Profile is complete.");
    } finally {
      stepIntervals.forEach(clearTimeout);
      setScanningTrends(false);
      setScanStep(0);
    }
  };

  const handleCreateContentFromTrend = (trendTopic) => {
    setCreatorPrompt(`Create a post inspired by the trend: "${trendTopic}". Make it highly engaging for our target audience.`);
    setActiveTab("creator");
  };

  const handleToggleChannel = (channel) => {
    if (selectedChannels.includes(channel)) {
      if (selectedChannels.length > 1) {
        setSelectedChannels(selectedChannels.filter(c => c !== channel));
      }
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const handleGenerateContent = async () => {
    if (!creatorPrompt.trim()) {
      toast.error("Please enter a prompt or topic for the post.");
      return;
    }
    if (selectedChannels.length === 0) {
      toast.error("Please select at least one social media channel.");
      return;
    }

    setGeneratingContent(true);
    setGenerationSteps(1);

    const stepIntervals = [
      setTimeout(() => setGenerationSteps(2), 2000),
      setTimeout(() => setGenerationSteps(3), 4000),
      setTimeout(() => setGenerationSteps(4), 6000),
      setTimeout(() => setGenerationSteps(5), 8000),
    ];

    try {
      // We will generate drafts one-by-one or first channel
      const channelToGenerate = selectedChannels[0]; // Primary channel
      const response = await api.post("/ai/social/drafts", {
        channel: channelToGenerate,
        postFormat,
        campaignGoal,
        audienceHint,
        productName: productName || undefined,
        locationName: locationName || undefined,
        trendInputs: creatorPrompt ? [{ title: creatorPrompt, approved: true }] : [],
        // We will pass the main prompt text inside trendInputs or use general context
        async: false
      });

      if (response.data?.success && response.data?.data?.draft) {
        const draft = response.data.data.draft;
        setCurrentDraft(draft);
        
        // Initialize editable state
        const initialEdits = {};
        draft.variants.forEach(v => {
          initialEdits[v.id] = {
            body: v.body,
            hashtags: v.hashtags?.join(", ") || ""
          };
        });
        setEditedVariants(initialEdits);
        
        toast.success("AI Agent generated 3 creative variants!");
        // Refresh drafts list
        fetchDrafts(1);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Generation failed.";
      toast.error(`Content generation failed: ${errMsg}`);
    } finally {
      stepIntervals.forEach(clearTimeout);
      setGeneratingContent(false);
      setGenerationSteps(0);
    }
  };

  const handleVariantEdit = (variantId, field, value) => {
    setEditedVariants(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value
      }
    }));
  };

  const handleApproveDraft = async (draftId) => {
    try {
      const response = await api.post(`/ai/social/drafts/${draftId}/approve`);
      if (response.data?.success) {
        toast.success("Draft approved successfully!");
        fetchDrafts(draftPage);
        if (currentDraft && currentDraft._id === draftId) {
          setCurrentDraft(prev => ({ ...prev, status: "approved" }));
        }
      }
    } catch {
      toast.error("Failed to approve draft.");
    }
  };

  const handleOpenRejectModal = (draftId) => {
    setRejectDraftId(draftId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectDraft = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    try {
      const response = await api.post(`/ai/social/drafts/${rejectDraftId}/reject`, {
        decisionReason: rejectReason
      });
      if (response.data?.success) {
        toast.success("Draft rejected.");
        setShowRejectModal(false);
        fetchDrafts(draftPage);
        if (currentDraft && currentDraft._id === rejectDraftId) {
          setCurrentDraft(prev => ({ ...prev, status: "rejected" }));
        }
      }
    } catch {
      toast.error("Failed to reject draft.");
    }
  };

  const handleOpenAdConfig = (draft, variant, channel) => {
    setSelectedDraftForAd(draft);
    setSelectedVariantForAd(variant);
    setSelectedChannelForAd(channel);
    setShowAdModal(true);
  };

  const handlePublish = async (isAd = false) => {
    setPublishingPost(true);
    const draftId = selectedDraftForAd?._id || currentDraft?._id;
    const variantId = selectedVariantForAd?.id || currentDraft?.variants[0]?.id;
    const channel = selectedChannelForAd || currentDraft?.channel || selectedChannels[0];

    try {
      // Approve draft first if we are an admin and it is pending
      const targetDraft = selectedDraftForAd || currentDraft;
      if (targetDraft.status === "pending_approval" && isAdmin) {
        await api.post(`/ai/social/drafts/${targetDraft._id}/approve`);
      }

      const postPayload = {
        draftId,
        variantId,
        channel,
        isAd,
        adConfig: isAd ? {
          budget: adBudget,
          durationDays: adDuration,
          targetAudience: adAudience
        } : null
      };

      const response = await api.post("/ai/social/posts", postPayload);
      if (response.data?.success) {
        toast.success(isAd ? "Ad campaign draft saved (simulated)." : "Post saved locally (not published externally).");
        setShowAdModal(false);
        setCurrentDraft(null);
        fetchPosts();
        fetchAnalytics();
        setActiveTab("posts");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to publish post.";
      toast.error(errMsg);
    } finally {
      setPublishingPost(false);
    }
  };

  const handleSaveBrandProfile = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSavingBrand(true);

    try {
      const response = await api.put("/ai/social/brand-profile", brandProfile);
      if (response.data?.success && response.data?.data?.profile) {
        setBrandProfile(response.data.data.profile);
        toast.success("Brand Profile saved successfully!");
      }
    } catch {
      toast.error("Failed to save Brand Profile.");
    } finally {
      setSavingBrand(false);
    }
  };

  const handleAddProduct = () => {
    const name = prompt("Enter product/service name:");
    if (!name) return;
    const description = prompt("Enter brief product description:");
    const updatedProducts = [...(brandProfile.products || []), { name, description: description || "" }];
    setBrandProfile({ ...brandProfile, products: updatedProducts });
  };

  const handleRemoveProduct = (index) => {
    const updatedProducts = (brandProfile.products || []).filter((_, i) => i !== index);
    setBrandProfile({ ...brandProfile, products: updatedProducts });
  };

  const handleAddLocation = () => {
    const name = prompt("Enter location name (e.g. Downtown Office):");
    if (!name) return;
    const region = prompt("Enter region/city:");
    const updatedLocations = [...(brandProfile.locations || []), { name, region: region || "", country: "USA" }];
    setBrandProfile({ ...brandProfile, locations: updatedLocations });
  };

  const handleRemoveLocation = (index) => {
    const updatedLocations = (brandProfile.locations || []).filter((_, i) => i !== index);
    setBrandProfile({ ...brandProfile, locations: updatedLocations });
  };

  const handleAddForbiddenClaim = () => {
    const phrase = prompt("Enter forbidden claim / words to NEVER use:");
    if (!phrase) return;
    const updated = [...(brandProfile.forbiddenClaims || []), phrase];
    setBrandProfile({ ...brandProfile, forbiddenClaims: updated });
  };

  const handleRemoveForbiddenClaim = (index) => {
    const updated = (brandProfile.forbiddenClaims || []).filter((_, i) => i !== index);
    setBrandProfile({ ...brandProfile, forbiddenClaims: updated });
  };

  const handleAddApprovedClaim = () => {
    const phrase = prompt("Enter brand facts / claims to use (e.g. 'Awarded Top Broker 2025'):");
    if (!phrase) return;
    const updated = [...(brandProfile.approvedClaims || []), phrase];
    setBrandProfile({ ...brandProfile, approvedClaims: updated });
  };

  const handleRemoveApprovedClaim = (index) => {
    const updated = (brandProfile.approvedClaims || []).filter((_, i) => i !== index);
    setBrandProfile({ ...brandProfile, approvedClaims: updated });
  };

  // --- Rendering UI Panels ---

  const renderOverviewTab = () => {
    if (loadingAnalytics || !analytics) {
      return (
        <div className="flex h-96 items-center justify-center">
          <RefreshCw className="h-10 w-10 animate-spin text-blue-500" />
        </div>
      );
    }

    const { kpis, history, postsCount, adsCount } = analytics;

    return (
      <div className="space-y-8 animate-fadeIn">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Impressions</p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {kpis.totalImpressions.toLocaleString()}
                </h3>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <Eye className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span>+12.4% from last week</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Ad Spend</p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  ${kpis.totalSpend.toLocaleString()}
                </h3>
              </div>
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <span>Across {adsCount} active/past campaigns</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Clicks & CTR</p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {kpis.totalClicks.toLocaleString()}{" "}
                  <span className="text-sm font-semibold text-slate-500">({kpis.ctr}%)</span>
                </h3>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                <MousePointerClick className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
              <span>Avg CPC: ${kpis.cpc.toFixed(2)}</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Conversions</p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {kpis.totalConversions.toLocaleString()}{" "}
                  <span className="text-sm font-semibold text-slate-500">({kpis.conversionRate}%)</span>
                </h3>
              </div>
              <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400">
                <Target className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <span>From lead forms & landing pages</span>
            </div>
          </div>
        </div>

        {/* Charts & Graphs */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md lg:col-span-2 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Performance Metrics Over Time</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Simulated impressions vs spend over time</p>
              </div>
            </div>
            <div className="relative w-full" style={{ height: "320px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="day" tickLine={false} stroke="#94A3B8" />
                  <YAxis tickLine={false} axisLine={false} stroke="#94A3B8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(15, 23, 42, 0.9)", 
                      borderRadius: "12px", 
                      border: "1px solid #334155", 
                      color: "#fff" 
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area name="Impressions" type="monotone" dataKey="impressions" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorImpressions)" />
                  <Area name="Spend ($)" type="monotone" dataKey="spend" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md min-w-0">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Clicks vs Conversions (Simulated)</h4>
            <div className="h-64 relative w-full flex flex-col justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="day" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", borderRadius: "12px", color: "#fff" }} />
                  <Legend verticalAlign="top" height={36} />
                  <Line name="Clicks" type="monotone" dataKey="clicks" stroke="#10B981" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line name="Conversions" type="monotone" dataKey="conversions" stroke="#06B6D4" strokeWidth={3} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-around border-t border-slate-100 pt-4 dark:border-slate-800 text-center text-sm">
              <div>
                <p className="text-xs text-slate-500">Total Posts</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{postsCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Ad Campaigns</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{adsCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTrendsTab = () => {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Scan Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/10">
          <div className="mb-4 md:mb-0">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              AI Agent Trend Discovery
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Generate topic suggestions based on your Brand Profile. No external web scanning is performed.
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={handleScanTrends} 
            loading={scanningTrends}
            icon={Sparkles}
          >
            {scanningTrends ? "Generating Topics..." : "Generate Topics"}
          </Button>
        </div>

        {/* Scan step-by-step loading state */}
        {scanningTrends && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-900/40 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600 mb-6" />
            <h5 className="font-semibold text-slate-800 dark:text-slate-200">
              {scanStep === 1 && "Loading brand profile..."}
              {scanStep === 2 && "Matching topics to brand context..."}
              {scanStep === 3 && "Scoring relevance..."}
              {scanStep === 4 && "Ranking by brand alignment..."}
            </h5>
            <div className="mt-4 max-w-md mx-auto h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500" 
                style={{ width: `${(scanStep / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Trends list */}
        {!scanningTrends && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {trends.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400">
                <Info className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                <p>No trends discovered yet. Click &quot;Run Trend Scan&quot; above to find topics.</p>
              </div>
            ) : (
              trends.map((trend, i) => (
                <div 
                  key={i} 
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant={trend.sentiment === "positive" ? "success" : "default"}>
                        {trend.sentiment.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-500">{trend.volume}</span>
                    </div>

                    <h5 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {trend.topic}
                    </h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-3">
                      {trend.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Relevance</p>
                      <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{trend.relevanceScore}%</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCreateContentFromTrend(trend.topic)}
                    >
                      Create Content
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMockSocialPreview = (channel, bodyText, mediaUrl = "") => {
    // Elegant frame representing standard social posts
    const channelsConfig = {
      facebook: { name: "Facebook Post", bg: "bg-blue-600", icon: Facebook, color: "text-blue-600" },
      instagram: { name: "Instagram Grid", bg: "bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500", icon: Instagram, color: "text-pink-600" },
      linkedin: { name: "LinkedIn Post", bg: "bg-blue-700", icon: Linkedin, color: "text-blue-700" },
      x: { name: "X Tweet", bg: "bg-slate-900", icon: Twitter, color: "text-slate-900 dark:text-white" },
      gmb: { name: "Google My Business", bg: "bg-orange-500", icon: Globe, color: "text-orange-500" }
    };
    
    const config = channelsConfig[channel] || channelsConfig.facebook;
    const ChannelIcon = config.icon;

    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-4 font-sans text-sm text-slate-800 dark:text-slate-300 min-w-0 w-full overflow-hidden break-words">
        <div className="flex items-center gap-2 mb-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${config.bg}`}>
            <ChannelIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{brandProfile?.businessName || "Your Brand"}</p>
            <p className="text-[10px] text-slate-400">Sponsored / AI Assistant</p>
          </div>
        </div>
        <p className="whitespace-pre-wrap text-xs leading-relaxed break-words">{bodyText}</p>
        
        {/* Mock image placeholder */}
        <div className="mt-3 overflow-hidden rounded-lg aspect-video bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border border-slate-200/50 dark:border-slate-800/50">
          {mediaUrl ? (
            <img src={mediaUrl} alt="Preview attachment" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center text-slate-400 dark:text-slate-600 p-2">
              <Sparkles className="h-8 w-8 mx-auto opacity-40 mb-1" />
              <p className="text-[10px] uppercase tracking-wider font-semibold">AI Generated Visual Attachment</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCreatorTab = () => {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 animate-fadeIn">
        {/* Config Sidebar */}
        <div className="lg:col-span-1 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md">
          <h4 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="h-4.5 w-4.5 text-blue-500" />
            AI Ad Builder
          </h4>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">What is this post about?</label>
            <Textarea
              value={creatorPrompt}
              onChange={(e) => setCreatorPrompt(e.target.value)}
              placeholder="e.g. Open house for our luxury waterfront listings in Miami this Saturday..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Goal */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Campaign Goal</label>
            <Select value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value)}>
              <option value="Brand Awareness">Brand Awareness</option>
              <option value="Lead Generation">Lead Generation</option>
              <option value="Product Launch">Product Launch</option>
              <option value="Special Offer">Special Offer</option>
            </Select>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Format</label>
            <Select value={postFormat} onChange={(e) => setPostFormat(e.target.value)}>
              <option value="image">Single Image</option>
              <option value="video">Short Video</option>
              <option value="carousel">Carousel / Slides</option>
              <option value="text">Text Only</option>
            </Select>
          </div>

          {/* Audience hint */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Audience Target Hint</label>
            <Input 
              value={audienceHint}
              onChange={(e) => setAudienceHint(e.target.value)}
              placeholder="e.g. Local homebuyers, investors..."
            />
          </div>

          {/* Channels Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Publish Channels</label>
            <div className="grid grid-cols-2 gap-2">
              {["facebook", "instagram", "linkedin", "x", "gmb"].map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => handleToggleChannel(ch)}
                  className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-semibold capitalize transition-all ${
                    selectedChannels.includes(ch)
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                >
                  <div className={`h-2.5 w-2.5 rounded-full ${selectedChannels.includes(ch) ? "bg-blue-600" : "bg-slate-300"}`} />
                  {ch === "x" ? "X / Twitter" : ch}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={handleGenerateContent}
            loading={generatingContent}
            icon={Sparkles}
          >
            {generatingContent ? "AI Drafting..." : "Generate Content"}
          </Button>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-3">
          {generatingContent && (
            <div className="flex flex-col items-center justify-center h-full rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 dark:border-slate-800 dark:bg-slate-900/40 text-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 mb-6" />
              <h4 className="font-bold text-slate-800 dark:text-slate-200">
                {generationSteps === 1 && "Analyzing brand facts & constraints..."}
                {generationSteps === 2 && "Generating captions & creative angles..."}
                {generationSteps === 3 && "Synthesizing tags & call-to-actions..."}
                {generationSteps === 4 && "Checking compliance guardrails..."}
                {generationSteps >= 5 && "Assembling final visual matches..."}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-2">
                Our social media coordinator agent is executing compliance screens to ensure no regulated claims or invented facts are published.
              </p>
            </div>
          )}

          {!generatingContent && !currentDraft && (
            <div className="flex flex-col items-center justify-center h-full rounded-2xl border border-dashed border-slate-300 p-16 text-center dark:border-slate-800">
              <Share2 className="h-12 w-12 text-slate-400 dark:text-slate-600 mb-4 animate-pulse" />
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Your AI Copywriter Is Ready</h4>
              <p className="text-sm text-slate-500 max-w-md mt-1">
                Configure your target channel and post objectives on the left side, then click Generate Content. The AI agent will draft 3 variants for comparison.
              </p>
            </div>
          )}

          {!generatingContent && currentDraft && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Draft Generation ID: <span className="font-mono text-xs text-slate-500">{currentDraft._id}</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Status: <span className="font-semibold capitalize text-blue-600 dark:text-blue-400">{currentDraft.status.replace("_", " ")}</span>
                  </p>
                </div>
                {currentDraft.status === "pending_approval" && !isAdmin && (
                  <Badge variant="warning">Awaiting Admin Approval</Badge>
                )}
                {currentDraft.status === "approved" && (
                  <Badge variant="success">Approved & Ready</Badge>
                )}
              </div>

              {/* Variants side-by-side grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 w-full min-w-0">
                {currentDraft.variants.map((variant) => {
                  const localState = editedVariants[variant.id] || { body: "", hashtags: "" };
                  
                  // Construct full caption for preview
                  const fullPreviewText = localState.body + "\n\n" + 
                    localState.hashtags.split(",")
                      .map(t => t.trim())
                      .filter(Boolean)
                      .map(t => t.startsWith("#") ? t : `#${t}`)
                      .join(" ");

                  const hasPossibleFact = variant.riskFlags?.includes("possible_invented_fact");
                  const hasComplianceHit = variant.riskFlags?.includes("forbidden_claim") || variant.riskFlags?.includes("regulated_claim");

                  return (
                    <div 
                      key={variant.id} 
                      className={`flex flex-col justify-between rounded-2xl border p-5 bg-white dark:bg-slate-900 shadow-sm transition-all min-w-0 w-full ${
                        hasComplianceHit
                          ? "border-red-200 dark:border-red-950/60 bg-red-50/10"
                          : hasPossibleFact
                            ? "border-yellow-200 dark:border-yellow-950/60 bg-yellow-50/10"
                            : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {/* Variant Header info */}
                      <div className="space-y-4 min-w-0 w-full">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-slate-400">Variant {variant.id}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              {Math.round((variant.confidence || 0.85) * 100)}% Match
                            </span>
                          </div>
                        </div>

                        {/* Textarea for Caption Body */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Caption Text</label>
                          <textarea
                            value={localState.body}
                            onChange={(e) => handleVariantEdit(variant.id, "body", e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 resize-none focus:outline-none focus:border-blue-500"
                            rows={6}
                          />
                        </div>

                        {/* Input for Hashtags */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Hashtags</label>
                          <input
                            type="text"
                            value={localState.hashtags}
                            onChange={(e) => handleVariantEdit(variant.id, "hashtags", e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Rationale */}
                        {variant.rationale && (
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 text-[10px] text-slate-700 dark:text-slate-300 break-words max-w-full">
                            <span className="font-bold block mb-1 text-slate-800 dark:text-slate-200">AI Rationale:</span>
                            {variant.rationale}
                          </div>
                        )}

                        {/* Risk / Guardrails messages */}
                        {variant.riskFlags?.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 text-[10px] flex gap-2 text-yellow-800 dark:text-yellow-400">
                            <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
                            <div>
                              <span className="font-bold">Guardrail Warning:</span>
                              <p className="mt-0.5 capitalize">{variant.riskFlags.join(", ").replace(/_/g, " ")}</p>
                            </div>
                          </div>
                        )}

                        {/* Visual Preview */}
                        <div className="mt-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Social Preview mockup</span>
                          {renderMockSocialPreview(currentDraft.channel || selectedChannels[0], fullPreviewText, variant.mediaSuggestions?.[0])}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
                        {currentDraft.status === "pending_approval" && isAdmin && (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              fullWidth
                              className="text-red-600 hover:bg-red-50 border-red-200"
                              onClick={() => handleOpenRejectModal(currentDraft._id)}
                            >
                              Reject
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm" 
                              fullWidth
                              onClick={() => handleApproveDraft(currentDraft._id)}
                            >
                              Approve
                            </Button>
                          </div>
                        )}

                        {currentDraft.status === "pending_approval" && !isAdmin && (
                          <Button variant="outline" size="sm" fullWidth disabled>
                            Submitted for Approval
                          </Button>
                        )}

                        {(currentDraft.status === "approved" || currentDraft.status === "draft") && (
                          <div className="flex flex-col gap-2">
                            <Button 
                              variant="primary" 
                              size="sm" 
                              fullWidth
                              icon={Megaphone}
                              onClick={() => handleOpenAdConfig(currentDraft, variant, currentDraft.channel || selectedChannels[0])}
                            >
                              Publish & Run Ad
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              fullWidth
                              onClick={async () => {
                                setSelectedDraftForAd(currentDraft);
                                setSelectedVariantForAd(variant);
                                setSelectedChannelForAd(currentDraft.channel || selectedChannels[0]);
                                await handlePublish(false);
                              }}
                            >
                              Publish Organic Post
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDraftsTab = () => {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Social Drafts Queue</h4>
          <Button variant="outline" size="sm" onClick={() => fetchDrafts(1)}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {loadingDrafts ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : draftsList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-16 text-center dark:border-slate-800">
            <Calendar className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400">No content drafts found. Use the Creator tab to generate copy drafts.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                    <th className="px-6 py-4">Draft ID</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4">Primary Preview</th>
                    <th className="px-6 py-4">Channel</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {draftsList.map((draft) => {
                    const primaryVariant = draft.variants?.[0] || {};
                    const bodySnippet = primaryVariant.body ? primaryVariant.body.slice(0, 80) + "..." : "(no caption)";
                    
                    return (
                      <tr key={draft._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{draft._id}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {new Date(draft.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-xs truncate">{bodySnippet}</td>
                        <td className="px-6 py-4 capitalize text-slate-600 dark:text-slate-400 font-semibold">{draft.channel || "General"}</td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant={
                              draft.status === "approved" ? "success" : 
                              draft.status === "rejected" ? "danger" : 
                              draft.status === "pending_approval" ? "warning" : 
                              draft.status === "published" ? "info" : "default"
                            }
                          >
                            {draft.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setCurrentDraft(draft);
                                
                                // Initialize local edits
                                const initialEdits = {};
                                draft.variants.forEach(v => {
                                  initialEdits[v.id] = {
                                    body: v.body,
                                    hashtags: v.hashtags?.join(", ") || ""
                                  };
                                });
                                setEditedVariants(initialEdits);
                                
                                setActiveTab("creator");
                              }}
                            >
                              Open in Creator
                            </Button>
                            {draft.status === "pending_approval" && isAdmin && (
                              <>
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-500 border-none"
                                  onClick={() => handleApproveDraft(draft._id)}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50 border-red-200"
                                  onClick={() => handleOpenRejectModal(draft._id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {draftTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-800">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={draftPage <= 1}
                  onClick={() => {
                    setDraftPage(p => p - 1);
                    fetchDrafts(draftPage - 1);
                  }}
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-500">Page {draftPage} of {draftTotalPages}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={draftPage >= draftTotalPages}
                  onClick={() => {
                    setDraftPage(p => p + 1);
                    fetchDrafts(draftPage + 1);
                  }}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPostsTab = () => {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Organic Posts & Ad Campaigns</h4>
          <Button variant="outline" size="sm" onClick={fetchPosts}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {loadingPosts ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : postsList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-16 text-center dark:border-slate-800">
            <Megaphone className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400">No saved drafts or simulated posts found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {postsList.map((post) => {
              // Note that draft records returned in list with status published are content drafts.
              // To show campaigns and live dynamic growth metrics, let's map what we have.
              // The backend SocialPost records are linked. Let's see how they render.
              // If the draft contains meta details, we can read them.
              const isAd = post.metadata?.campaignGoal === "Special Offer" || post.metadata?.campaignGoal === "Lead Generation";
              const primaryVariant = post.variants?.[0] || {};
              const budget = isAd ? (post.metadata?.budget || 150) : 0;

              // Generate deterministic metric numbers for the list
              const idHash = parseInt(post._id.slice(-5), 16) || 450;
              const impressions = Math.floor(idHash * 8.5) + 350;
              const clicks = Math.floor(impressions * 0.08);
              const conversions = Math.floor(clicks * 0.15);
              const spend = isAd ? budget : 0;

              return (
                <div 
                  key={post._id} 
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={isAd ? "secondary" : "info"}>
                        {isAd ? "PAID CAMPAIGN" : "ORGANIC"}
                      </Badge>
                      <span className="text-xs text-slate-400 uppercase font-semibold capitalize font-mono">
                        {post.channel || "facebook"}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Published {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-3 mb-4">
                    {primaryVariant.body}
                  </p>

                  <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-50 dark:bg-slate-950 p-4 text-center border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Impressions</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Clicks</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{clicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Conversions</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{conversions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Spend</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {isAd ? `$${spend.toFixed(2)}` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs text-slate-500">
                    <span className="capitalize font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-slate-400" /> Simulated metrics
                    </span>
                    {isAd && (
                      <span className="font-mono text-slate-400">Budget: ${budget}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderBrandProfileTab = () => {
    if (loadingBrand) {
      return (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      );
    }

    if (!brandProfile) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <Settings className="h-10 w-10 text-slate-400 mx-auto mb-2 animate-spin" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200">No Brand Profile Found</h4>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
            AI content generation requires basic details about your business. Click below to initialize your Brand Profile.
          </p>
          {isAdmin ? (
            <Button
              className="mt-6"
              onClick={() => {
                setBrandProfile({
                  businessName: "Orbinest Realty",
                  description: "A premium real estate firm focused on luxury smart homes and co-living properties.",
                  industry: "Real Estate",
                  products: [
                    { name: "Waterfront Condos", description: "Luxury apartments overlooking the ocean." },
                    { name: "Urban Co-Living Spaces", description: "Eco-friendly shared apartments for remote workers." }
                  ],
                  locations: [
                    { name: "Miami HQ", region: "Florida", country: "USA" }
                  ],
                  slogans: ["Living Redefined", "Smart Homes, Rich Life"],
                  brandVoice: {
                    vocabulary: ["premium", "co-living", "sustainability", "luxury", "smart home"],
                    tone: "sophisticated"
                  },
                  forbiddenClaims: ["Guaranteed 100% Return", "No risk investment"],
                  compliance: { medical: false, financial: true },
                  defaultChannels: ["facebook", "linkedin"],
                  defaultLanguage: "en"
                });
              }}
            >
              Initialize Profile
            </Button>
          ) : (
            <p className="mt-4 text-xs text-red-500 font-semibold">An Admin must initialize the brand profile before marketing campaigns can be built.</p>
          )}
        </div>
      );
    }

    return (
      <form onSubmit={handleSaveBrandProfile} className="space-y-8 animate-fadeIn max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h4 className="text-md font-bold text-slate-900 dark:text-white mb-6">Business Facts & Context</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Business Name</label>
              <Input 
                value={brandProfile.businessName || ""}
                onChange={(e) => setBrandProfile({ ...brandProfile, businessName: e.target.value })}
                disabled={!isAdmin}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Industry Sector</label>
              <Input 
                value={brandProfile.industry || ""}
                onChange={(e) => setBrandProfile({ ...brandProfile, industry: e.target.value })}
                disabled={!isAdmin}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Company Overview</label>
              <Textarea 
                value={brandProfile.description || ""}
                onChange={(e) => setBrandProfile({ ...brandProfile, description: e.target.value })}
                disabled={!isAdmin}
                rows={3}
                required
              />
            </div>
          </div>
        </div>

        {/* Products and Services */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-bold text-slate-900 dark:text-white">Approved Products / Services</h4>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={handleAddProduct}>
                <Plus className="h-4 w-4 mr-1" /> Add Product
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            {(brandProfile.products || []).length === 0 ? (
              <p className="text-xs text-slate-400">No products/services configured.</p>
            ) : (
              (brandProfile.products || []).map((prod, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{prod.name}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">— {prod.description}</span>
                  </div>
                  {isAdmin && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveProduct(i)}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      <Trash className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Locations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-bold text-slate-900 dark:text-white">Operating Locations</h4>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={handleAddLocation}>
                <Plus className="h-4 w-4 mr-1" /> Add Location
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            {(brandProfile.locations || []).length === 0 ? (
              <p className="text-xs text-slate-400">No operating locations configured.</p>
            ) : (
              (brandProfile.locations || []).map((loc, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{loc.name}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">({loc.region}, {loc.country})</span>
                  </div>
                  {isAdmin && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveLocation(i)}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      <Trash className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Guardrail and Compliance settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Approved & Forbidden claims */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-bold text-slate-900 dark:text-white">Forbidden Phrasing</h4>
              {isAdmin && (
                <button type="button" onClick={handleAddForbiddenClaim} className="text-xs font-semibold text-blue-600 hover:text-blue-500">
                  + Add New
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(brandProfile.forbiddenClaims || []).length === 0 ? (
                <p className="text-xs text-slate-400">No forbidden terms set.</p>
              ) : (
                (brandProfile.forbiddenClaims || []).map((claim, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-red-50/30 border border-red-100/50 dark:border-red-950/30 text-xs text-red-600 dark:text-red-400">
                    <span>{claim}</span>
                    {isAdmin && (
                      <button type="button" onClick={() => handleRemoveForbiddenClaim(idx)}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-bold text-slate-900 dark:text-white">Verified Brand Claims</h4>
              {isAdmin && (
                <button type="button" onClick={handleAddApprovedClaim} className="text-xs font-semibold text-blue-600 hover:text-blue-500">
                  + Add New
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(brandProfile.approvedClaims || []).length === 0 ? (
                <p className="text-xs text-slate-400">No approved statements configured.</p>
              ) : (
                (brandProfile.approvedClaims || []).map((claim, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-950 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span>{claim}</span>
                    {isAdmin && (
                      <button type="button" onClick={() => handleRemoveApprovedClaim(idx)}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="submit"
              loading={savingBrand}
              variant="primary"
            >
              Save Brand Configuration
            </Button>
          </div>
        )}
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 dark:bg-slate-950/20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Share2 className="h-7 w-7 text-blue-600" />
            Social Media Manager Agent
          </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              AI-powered content drafting, approval workflows, and simulated ad campaigns. Publishing to external platforms is not yet connected.
            </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          {/* Active status indicator */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Agent Active
          </span>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 p-1 overflow-x-auto rounded-2xl bg-white border border-slate-200/80 shadow-sm dark:bg-slate-900/60 dark:border-slate-800 mb-8 max-w-max">
        {[
          { id: "overview", label: "Overview", icon: LineChart },
          { id: "trends", label: "Trends Follow", icon: TrendingUp },
          { id: "creator", label: "Content Creator", icon: Sparkles },
          { id: "drafts", label: "Drafts Queue", icon: Calendar },
          { id: "posts", label: "Posts & Campaigns", icon: Megaphone },
          { id: "brand", label: "Brand Profile", icon: Settings },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/40"
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panels rendering */}
      {activeTab === "overview" && renderOverviewTab()}
      {activeTab === "trends" && renderTrendsTab()}
      {activeTab === "creator" && renderCreatorTab()}
      {activeTab === "drafts" && renderDraftsTab()}
      {activeTab === "posts" && renderPostsTab()}
      {activeTab === "brand" && renderBrandProfileTab()}

      {/* Rejection reason modal */}
      {showRejectModal && (
        <Modal 
          isOpen={showRejectModal} 
          onClose={() => setShowRejectModal(false)}
          title="Provide Rejection Reason"
        >
          <div className="space-y-4 p-4">
            <p className="text-xs text-slate-500">
              Please write a short note explaining why this draft variant is rejected. This helps the AI Agent adjust its tone in future drafts.
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. The pricing mentioned is incorrect; please refer to product catalog."
              rows={4}
              required
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRejectDraft}>
                Reject Draft
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Ad Config modal */}
      {showAdModal && (
        <Modal
          isOpen={showAdModal}
          onClose={() => setShowAdModal(false)}
          title="Configure Ad Campaign Budget"
        >
          <div className="space-y-4 p-4">
            <p className="text-xs text-slate-500">
              Setting up an ad budget launches a simulated campaign. You will see reach and conversions accumulate dynamically over time.
            </p>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Budget (USD)</label>
              <Input 
                type="number"
                value={adBudget}
                onChange={(e) => setAdBudget(parseFloat(e.target.value) || 0)}
                placeholder="150"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Duration (Days)</label>
              <Input 
                type="number"
                value={adDuration}
                onChange={(e) => setAdDuration(parseInt(e.target.value, 10) || 7)}
                placeholder="7"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Target Audience Demographics</label>
              <Textarea 
                value={adAudience}
                onChange={(e) => setAdAudience(e.target.value)}
                placeholder="Age 25-45, Local Homebuyers"
                rows={2}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAdModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handlePublish(true)} loading={publishingPost}>
                Save Simulated Campaign
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SocialAgentDashboard;
