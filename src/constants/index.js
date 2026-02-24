// Lead Status Options
export const STATUS_OPTIONS = [
  { value: "NEW", label: "New Lead", color: "blue" },
  { value: "IN_REVIEW", label: "In Review", color: "cyan" },
  { value: "CONTACTED", label: "Contacted", color: "purple" },
  { value: "QUALIFIED", label: "Qualified", color: "green" },
  { value: "FOLLOW_UP", label: "Follow Up", color: "yellow" },
  { value: "CONVERTED", label: "Converted", color: "success" },
  { value: "CLOSED", label: "Closed", color: "gray" },
];

// Lead Source Options
export const SOURCE_OPTIONS = [
  { value: "Exhibition", label: "Exhibition Visit" },
  { value: "Website", label: "Website Inquiry" },
  { value: "Referral", label: "Referral" },
  { value: "Direct", label: "Direct Contact" },
  { value: "Cold Call", label: "Cold Call" },
  { value: "Trade Show", label: "Trade Show" },
];

// Marketing Reviewer Options
export const MARKETING_REVIEWERS = [
  "Gaurav Kumar",
  "Amit Thaklur",
  "Asish Tyagi",
  "Ashok Gaur",
  "BHagat Sharma",
  "Deepak Dua",
  "Devendar Singh",
  "Gautam Sir",
  "Harish",
  "Rajeev Bakshi",
  "Sonu Kaushik",
  "Tarandeep",
];

// Quick Reply Templates (Admin)
export const QUICK_REPLY_TEMPLATES = [
  "Discussed requirements. Sharing quotation shortly.",
  "Sample requested. Dispatch planned by tomorrow.",
  "Technical specs shared. Waiting for confirmation.",
  "Follow-up call completed. Awaiting final approval.",
  "Pricing discussed. Customer reviewing internally.",
  "Meeting scheduled for product demonstration.",
  "Requested additional details before proceeding.",
  "PO expected this week as discussed.",
];

// Product/Requirement Options
export const REQUIREMENT_OPTIONS = [
  "Corrugated Boxes",
  "Luxury Rigid Boxes",
  "WetBoxTech",
  "Insulated Corrugated Box",
  "Side Gusset Pouch",
  "Spout Pouch",
  "Stand-up Pouch",
  "Retort Pouch",
  "Three Side Seal Pouch",
  "Shopping Bag",
  "Bubble Bag",
  "Padded Mailer Bag",
  "Poly Bag",
  "Paper Bag",
  "APEO Free Tape",
  "Paper Tape",
  "BOPP Tape",
  "Hot Melt BOPP Tape",
  "Cross Filament Tape",
  "Glass Cloth Tape",
  "Polyester Tape",
  "Aluminium Foil Tape",
  "Masking Tape",
  "Tissue Tape",
  "Direct Thermal Labels",
  "Chromo Labels",
  "Custom Labels",
  "Folding Cartons",
  "Printed Fluted Cartons",
  "Litho Laminated Cartons",
  "Monocartons",
  "Carry Bags",
  "Food Wrapping Paper",
  "Carry Handle Tape",
];

// Default Sheet Options (Events)
export const DEFAULT_SHEET_OPTIONS = [
  "Aahar",
  "PackExpo",
  "Americas Food and Beverage Show",
  "Gulfood",
];

// Navigation Items for Admin
export const ADMIN_NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: "dashboard" },
  { path: "/admin/tickets", label: "Leads", icon: "ticket" },
  { path: "/admin/users", label: "Contacts", icon: "users" },
  { path: "/admin/reports", label: "Analytics", icon: "report" },
  { path: "/admin/settings", label: "Settings", icon: "settings" },
];

// Navigation Items for User
export const USER_NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: "dashboard" },
  { path: "/tickets", label: "My Tickets", icon: "ticket" },
  { path: "/new-ticket", label: "New Ticket", icon: "add" },
  { path: "/profile", label: "Profile", icon: "profile" },
];
