import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarRange,
  ChartColumnBig,
  CheckCircle2,
  CirclePlay,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";

const statItems = [
  { value: "1", label: "connected workspace for events, registrations, and CRM" },
  { value: "360", label: "degree visibility across attendees, teams, and pipeline" },
  { value: "24/7", label: "access for admins, marketers, and event operators" },
];

const platformCards = [
  {
    icon: Ticket,
    title: "Registration journeys",
    description:
      "Launch polished event pages, ticket types, coupon flows, waitlists, and branded confirmation experiences.",
  },
  {
    icon: Users,
    title: "Attendee operations",
    description:
      "Keep registrations, attendee details, assignments, check-ins, and support activity aligned inside one workflow.",
  },
  {
    icon: Workflow,
    title: "Team execution",
    description:
      "Coordinate marketing, operations, sales, and admin users without losing context across tools.",
  },
  {
    icon: ChartColumnBig,
    title: "Revenue and CRM",
    description:
      "Track what events generate, what teams convert, and where registrations become business outcomes.",
  },
];

const splitSections = [
  {
    id: "registrations",
    eyebrow: "Registration Experience",
    title: "Create event pages that do more than collect names.",
    body:
      "Orbinest gives you branded event pages, custom registration fields, ticket controls, pricing rules, coupon handling, and confirmation flows designed for modern event teams.",
    bullets: [
      "Branded public event pages",
      "Ticket types, pricing, and waitlists",
      "Custom attendee fields and confirmations",
    ],
    image: "/orbinest-registration-shot.svg",
    reverse: false,
  },
  {
    id: "operations",
    eyebrow: "Live Operations",
    title: "Move from registration to check-in without context switching.",
    body:
      "The platform keeps attendee data, operational status, and team workflows connected so live execution feels structured instead of reactive.",
    bullets: [
      "Check-in and on-site readiness",
      "Registration lookup and status visibility",
      "Shared workflow between ops and marketing teams",
    ],
    image: "/orbinest-operations-shot.svg",
    reverse: true,
  },
  {
    id: "crm",
    eyebrow: "CRM and Reporting",
    title: "Turn every event into measurable pipeline and revenue insight.",
    body:
      "Orbinest connects event activity with CRM follow-through, helping teams track attendee outcomes, conversion signals, and post-event momentum from one view.",
    bullets: [
      "Lead and client follow-up visibility",
      "Revenue, conversion, and team reporting",
      "Connected admin, marketing, and CRM workflows",
    ],
    image: "/orbinest-crm-shot.svg",
    reverse: false,
  },
];

const audienceItems = [
  "Event organizers who need more than a form builder",
  "Marketing teams that want registrations connected to follow-up",
  "Operations teams that need visibility on tickets and check-ins",
  "Admins managing multiple users, websites, and event workflows",
];

const resourceCards = [
  {
    title: "Workspace launch",
    description:
      "Create your Orbinest workspace and centralize event, registration, and CRM operations from day one.",
    cta: "Register Workspace",
    href: "/register",
  },
  {
    title: "Team access",
    description:
      "Already have a company setup? Sign in or join an existing workspace as a marketing team member.",
    cta: "Go to Login",
    href: "/login",
  },
  {
    title: "Marketing onboarding",
    description:
      "Bring campaign and field teams into the same operating layer with workspace-linked registration access.",
    cta: "Register as Marketing Manager",
    href: "/register-marketing-manager",
  },
];

const sectionMotion = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.65, ease: "easeOut" },
};

const itemMotion = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.45, ease: "easeOut", delay },
});

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700/80">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(167,139,250,0.16),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_42%,#f8fafc_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-400 to-violet-500 shadow-lg shadow-cyan-200/70">
              <Sparkles className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-slate-950">
                Orbinest
              </p>
              <p className="text-[11px] uppercase tracking-[0.28em] text-sky-700/80">
                From Registration to Revenue
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            <a href="#platform" className="text-sm font-medium text-slate-600 transition hover:text-slate-950">
              Platform
            </a>
            <a href="#registrations" className="text-sm font-medium text-slate-600 transition hover:text-slate-950">
              Registrations
            </a>
            <a href="#operations" className="text-sm font-medium text-slate-600 transition hover:text-slate-950">
              Operations
            </a>
            <a href="#crm" className="text-sm font-medium text-slate-600 transition hover:text-slate-950">
              CRM
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-slate-950"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <main>
        <motion.section {...sectionMotion} className="relative overflow-hidden">
          <div className="mx-auto grid max-w-7xl gap-14 px-4 py-18 sm:px-6 lg:grid-cols-[0.96fr_1.04fr] lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm text-sky-700 shadow-sm"
              >
                <CalendarRange className="h-4 w-4" />
                Event Operations Platform
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.06 }}
                className="mt-6 text-5xl font-extrabold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl"
              >
                Run the full event lifecycle from one connected workspace.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.14 }}
                className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl"
              >
                Orbinest helps teams launch event pages, capture registrations,
                manage attendees, coordinate live operations, and convert event
                outcomes into revenue and CRM momentum without switching tools.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.22 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Start with Orbinest
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-sky-300 hover:bg-sky-50"
                >
                  <CirclePlay className="h-4 w-4" />
                  Login to Workspace
                </Link>
              </motion.div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {statItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    {...itemMotion(0.28 + index * 0.08)}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(148,163,184,0.14)]"
                  >
                    <p className="text-2xl font-extrabold text-slate-950">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.12 }}
              className="relative"
            >
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-10 top-8 h-36 w-36 rounded-full bg-sky-200/70 blur-3xl"
              />
              <motion.div
                animate={{ y: [8, -8, 8] }}
                transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-10 bottom-10 h-40 w-40 rounded-full bg-violet-200/70 blur-3xl"
              />

              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
                <div className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#eef6ff)] p-4">
                  <img
                    src="/orbinest-hero-shot.svg"
                    alt="Orbinest application overview"
                    className="w-full rounded-[1.2rem] object-cover"
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    "Public event pages",
                    "Attendee workflows",
                    "CRM conversion tracking",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section {...sectionMotion} className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_16px_60px_rgba(148,163,184,0.12)] sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700/80">
                  Built for modern teams
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                  A platform, not a patchwork of forms, spreadsheets, and follow-up tools.
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {["Event Ops", "Marketing", "Sales", "Admin"].map((label) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section id="platform" {...sectionMotion} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(148,163,184,0.12)] sm:p-8">
            <SectionHeading
              eyebrow="Platform Overview"
              title="Everything your event engine needs, in one place"
              description="Orbinest is designed to connect the public event experience with internal execution, reporting, and CRM follow-through."
            />

            <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
              {platformCards.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.article
                    key={item.title}
                    {...itemMotion(index * 0.05)}
                    className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/90 to-violet-400/90 text-slate-950">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </motion.section>

        <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
          <div className="space-y-8">
            {splitSections.map((section, index) => (
              <motion.section
                key={section.id}
                id={section.id}
                {...sectionMotion}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(148,163,184,0.12)] sm:p-8"
              >
                <div
                  className={`grid gap-8 lg:grid-cols-2 lg:items-center ${
                    section.reverse ? "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700/80">
                      {section.eyebrow}
                    </p>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                      {section.title}
                    </h2>
                    <p className="mt-4 text-base leading-7 text-slate-600">
                      {section.body}
                    </p>

                    <div className="mt-6 space-y-3">
                      {section.bullets.map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                          <span className="text-sm leading-7 text-slate-700">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                      Section 0{index + 1}
                      <ArrowRight className="h-4 w-4 text-sky-600" />
                    </div>
                  </div>

                  <motion.div
                    animate={{ y: [-4, 4, -4] }}
                    transition={{ duration: 7 + index, repeat: Infinity, ease: "easeInOut" }}
                    className="rounded-[1.7rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#eef6ff)] p-4"
                  >
                    <img
                      src={section.image}
                      alt={section.title}
                      className="w-full rounded-[1.2rem] object-cover"
                    />
                  </motion.div>
                </div>
              </motion.section>
            ))}
          </div>
        </section>

        <motion.section {...sectionMotion} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[2rem] border border-sky-200 bg-[linear-gradient(180deg,#f0f9ff,#ecfeff)] p-7">
              <SectionHeading
                eyebrow="Application Information"
                title="What you can run inside Orbinest"
                description="Orbinest is designed as one connected platform instead of separate event, form, and CRM tools stitched together later."
              />

              <div className="mt-6 grid gap-4">
                {[
                  {
                    icon: CalendarRange,
                    title: "Event operations",
                    description:
                      "Manage event setup, landing content, ticket strategy, registration rules, and check-in readiness.",
                  },
                  {
                    icon: Wallet,
                    title: "Registration revenue",
                    description:
                      "Support paid and free registrations, coupon logic, attendee records, and post-event reporting.",
                  },
                  {
                    icon: Workflow,
                    title: "CRM follow-through",
                    description:
                      "Move attendee and lead data into your team workflow for follow-ups, conversions, and relationship building.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Workspace control",
                    description:
                      "Run permissions, tenants, websites, teams, and audit-friendly operations from a secure admin console.",
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      {...itemMotion(index * 0.05)}
                      className="rounded-[1.4rem] border border-sky-100 bg-white/80 p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-cyan-100">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-950">{item.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_16px_60px_rgba(148,163,184,0.12)]">
              <SectionHeading
                eyebrow="Who It Helps"
                title="Designed for cross-functional event teams"
                description="Whether you are launching events, collecting attendee data, or moving event outcomes into a sales workflow, the platform keeps every team aligned."
              />

              <div className="mt-6 space-y-3">
                {audienceItems.map((item, index) => (
                  <motion.div
                    key={item}
                    {...itemMotion(index * 0.05)}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                    <span className="text-sm leading-7 text-slate-700">
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {resourceCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    {...itemMotion(index * 0.06)}
                    className="rounded-[1.4rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5"
                  >
                    <h3 className="text-lg font-bold text-slate-950">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {card.description}
                    </p>
                    <Link
                      to={card.href}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-600"
                    >
                      {card.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
