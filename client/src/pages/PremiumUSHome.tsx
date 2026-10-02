import { Link } from "wouter";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  FileText,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";

function BodygraphPreview({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 260 420"
      className={compact ? "h-[240px] w-full" : "h-[330px] w-full md:h-[390px]"}
      role="img"
      aria-label="Stylized Human Design bodygraph preview"
    >
      <defs>
        <linearGradient id="hd-gold" x1="0" x2="1">
          <stop offset="0%" stopColor="#FFE6A8" />
          <stop offset="100%" stopColor="#D69E3C" />
        </linearGradient>
        <linearGradient id="hd-violet" x1="0" x2="1">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <filter id="hd-glow">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g opacity="0.26" stroke="#F4C762" fill="none">
        <circle cx="130" cy="210" r="112" />
        <circle cx="130" cy="210" r="92" strokeDasharray="3 8" />
        <line x1="130" y1="18" x2="130" y2="402" />
        <line x1="22" y1="210" x2="238" y2="210" />
      </g>

      <g stroke="url(#hd-gold)" strokeWidth="3.2" strokeLinecap="round" filter="url(#hd-glow)" opacity="0.92">
        <line x1="130" y1="66" x2="130" y2="122" />
        <line x1="130" y1="122" x2="90" y2="172" />
        <line x1="130" y1="122" x2="170" y2="172" />
        <line x1="90" y1="172" x2="105" y2="232" />
        <line x1="170" y1="172" x2="155" y2="232" />
        <line x1="105" y1="232" x2="130" y2="286" />
        <line x1="155" y1="232" x2="130" y2="286" />
        <line x1="130" y1="286" x2="130" y2="352" />
        <line x1="105" y1="232" x2="155" y2="232" />
      </g>

      <g stroke="#F8F4EA" strokeWidth="2.5">
        <polygon points="130,44 108,82 152,82" fill="url(#hd-gold)" />
        <rect x="108" y="103" width="44" height="38" rx="8" fill="#F3C55C" />
        <polygon points="90,151 66,177 90,203 114,177" fill="url(#hd-violet)" />
        <polygon points="170,151 146,177 170,203 194,177" fill="#EC8DA0" />
        <rect x="83" y="214" width="44" height="38" rx="7" fill="#D7834C" />
        <rect x="133" y="214" width="44" height="38" rx="7" fill="#9B78D3" />
        <polygon points="130,263 104,299 156,299" fill="#F3C55C" />
        <rect x="108" y="325" width="44" height="42" rx="8" fill="#D4A64D" />
      </g>

      <g fill="#F8F4EA" fontSize="8" fontFamily="ui-sans-serif, system-ui" textAnchor="middle" opacity="0.9">
        <text x="130" y="69">HEAD</text>
        <text x="130" y="126">AJNA</text>
        <text x="90" y="180">G</text>
        <text x="170" y="180">EGO</text>
        <text x="105" y="237">SPLEEN</text>
        <text x="155" y="237">SOLAR</text>
        <text x="130" y="288">SACRAL</text>
        <text x="130" y="350">ROOT</text>
      </g>
    </svg>
  );
}

function TrustPoint({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Sparkles;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#F4C762]/50 bg-[#F4C762]/10 text-[#F4C762]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/60">{text}</p>
      </div>
    </div>
  );
}

export default function PremiumUSHome({ localePath }: { localePath: (path: string) => string }) {
  const discovery = [
    { icon: Compass, title: "Your Energy Type", text: "How your energy naturally works." },
    { icon: Brain, title: "Decision Strategy", text: "A practical framework for choices." },
    { icon: Zap, title: "Inner Authority", text: "Your personal decision signal." },
    { icon: Star, title: "Profile & Life Theme", text: "The role you tend to grow through." },
    { icon: Users, title: "Relationships", text: "Explore patterns with other people." },
  ];

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#071426]">
      <section className="relative overflow-hidden bg-[#071426] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_34%,rgba(244,199,98,0.18),transparent_28%),radial-gradient(circle_at_34%_20%,rgba(139,92,246,0.14),transparent_34%),linear-gradient(135deg,#071426_0%,#0A1B31_58%,#111C35_100%)]" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:44px_44px]" />

        <header className="relative z-20 mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 md:px-8 lg:px-12">
          <Link href={localePath("/")} className="flex items-center gap-3 no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F4C762]/60 bg-[#F4C762]/10 text-[#F4C762]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-white sm:text-lg">
              HumanDesignChart.app
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-white/72 lg:flex">
            <Link href={localePath("/calculate")} className="transition hover:text-white">Get Your Chart</Link>
            <Link href={localePath("/encyclopedia")} className="transition hover:text-white">Learn</Link>
            <Link href={localePath("/ai-guide")} className="transition hover:text-white">Insights</Link>
            <Link href={localePath("/honorace")} className="transition hover:text-white">Pricing</Link>
            <Link href={localePath("/blog")} className="transition hover:text-white">Journal</Link>
          </nav>

          <Link
            href={localePath("/calculate")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F4C762] px-4 py-2.5 text-sm font-bold text-[#071426] shadow-[0_10px_34px_rgba(244,199,98,.25)] transition hover:-translate-y-0.5 hover:bg-[#FFE09A]"
          >
            Get My Free Chart <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] gap-10 px-5 pb-14 pt-7 md:px-8 md:pb-20 lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:px-12 lg:pb-24 lg:pt-12">
          <div className="max-w-2xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#F4C762]/90">
              Science · Wisdom · Self-discovery
            </p>
            <h1 className="max-w-[760px] font-serif text-[46px] font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-[76px]">
              Your Unique Design for a More{" "}
              <em className="font-serif font-medium text-[#F4C762]">Aligned Life</em>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/72 md:text-lg">
              Get your personalized Human Design chart and explore how your energy, decisions,
              relationships, and life patterns may fit together — in a clear, practical format.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <TrustPoint icon={Compass} title="Personalized" text="to your birth data" />
              <TrustPoint icon={Zap} title="Instant" text="chart calculation" />
              <TrustPoint icon={ShieldCheck} title="Private" text="your data stays yours" />
            </div>

            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href={localePath("/calculate")}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#FFE3A0] to-[#F4C762] px-7 py-4 text-base font-extrabold text-[#071426] shadow-[0_16px_44px_rgba(244,199,98,.28)] transition hover:-translate-y-0.5 sm:w-auto"
              >
                Get My Free Chart <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs leading-5 text-white/55">
                Free chart · No credit card · Instant results
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[760px]">
            <div className="absolute -inset-8 rounded-[3rem] bg-[radial-gradient(circle,rgba(244,199,98,.18),transparent_65%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-[#0B172A]/88 shadow-[0_34px_90px_rgba(0,0,0,.42)] backdrop-blur">
              <div className="relative min-h-[560px] overflow-hidden sm:min-h-[610px]">
                <img
                  src="/images/brand/marie-landing-v1.webp"
                  alt="Human Design guide visual"
                  className="absolute inset-0 h-full w-full object-cover opacity-72"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#071426]/90 via-[#071426]/45 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071426] via-transparent to-[#071426]/15" />

                <div className="absolute bottom-5 left-5 right-5 grid gap-4 sm:grid-cols-[1.05fr_.95fr]">
                  <div className="rounded-2xl border border-white/12 bg-[#08172B]/88 p-3 shadow-2xl backdrop-blur-md">
                    <BodygraphPreview />
                  </div>
                  <div className="self-end rounded-2xl border border-white/12 bg-[#08172B]/88 p-5 backdrop-blur-md">
                    <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#F4C762]">
                      Example chart snapshot
                    </p>
                    {[
                      ["Type", "Manifesting Generator"],
                      ["Strategy", "To Respond"],
                      ["Authority", "Sacral"],
                      ["Profile", "5/1"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between border-b border-white/8 py-3 last:border-0">
                        <span className="text-xs text-white/50">{label}</span>
                        <span className="text-sm font-semibold text-white">{value}</span>
                      </div>
                    ))}
                    <Link
                      href={localePath("/calculate")}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#F4C762]/40 bg-[#F4C762]/10 px-4 py-3 text-sm font-semibold text-[#FFE5A0] transition hover:bg-[#F4C762]/16"
                    >
                      See what your chart says <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#D9D3C7] bg-[#FBF8F1]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-px bg-[#D9D3C7] md:grid-cols-5">
          {discovery.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-[#FBF8F1] px-5 py-7 text-center md:px-6">
              <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#0D2442] text-[#F4C762]">
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-sm font-bold text-[#071426]">{title}</p>
              <p className="mt-1 text-xs leading-5 text-[#5E6773]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#FBF8F1] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B07A20]">Your personal chart</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] text-[#071426] md:text-5xl">
              Discover what makes your design unique
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#66707D]">
              Start with the free chart. Then explore deeper layers only when they are useful to you.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
            <div className="overflow-hidden rounded-[28px] border border-[#DDD6C8] bg-[#071426] shadow-xl">
              <div className="grid min-h-[520px] md:grid-cols-[.9fr_1.1fr]">
                <div className="flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(139,92,246,.18),transparent_66%)] p-8">
                  <BodygraphPreview />
                </div>
                <div className="flex flex-col justify-center border-t border-white/10 p-7 md:border-l md:border-t-0 md:p-10">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#F4C762]">What you receive</p>
                  <h3 className="mt-3 font-serif text-3xl text-white">A chart you can actually use.</h3>
                  <div className="mt-6 space-y-4">
                    {[
                      "Type, strategy, authority and profile",
                      "Defined centers, channels and gates",
                      "Clear explanations without jargon overload",
                      "Optional AI guidance grounded in your chart",
                    ].map(item => (
                      <div key={item} className="flex gap-3 text-sm leading-6 text-white/72">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F4C762]/12 text-[#F4C762]">
                          <Check className="h-3 w-3" />
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                  <Link
                    href={localePath("/calculate")}
                    className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#F4C762]"
                  >
                    Calculate my chart <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {[
                {
                  image: "/images/how-gifts.png",
                  eyebrow: "Understand your energy",
                  title: "See your natural operating pattern.",
                },
                {
                  image: "/images/how-relationships.png",
                  eyebrow: "Relationships",
                  title: "Explore where two designs meet.",
                },
                {
                  image: "/images/how-purpose.png",
                  eyebrow: "Direction",
                  title: "Turn abstract insights into reflection prompts.",
                },
              ].map(card => (
                <div key={card.title} className="group relative min-h-[180px] overflow-hidden rounded-[24px] border border-[#DDD6C8] bg-[#0D2442] shadow-sm">
                  <img src={card.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#071426]/92 via-[#071426]/68 to-[#071426]/15" />
                  <div className="relative z-10 flex h-full min-h-[180px] max-w-sm flex-col justify-end p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.23em] text-[#F4C762]">{card.eyebrow}</p>
                    <p className="mt-2 font-serif text-2xl leading-tight text-white">{card.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071426] px-5 py-16 text-white md:px-8 md:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-12 max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#F4C762]">How it works</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] md:text-5xl">
              Three steps from birth data to your chart
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: CalendarDays,
                title: "Enter your birth data",
                text: "Date, exact time and place of birth.",
              },
              {
                n: "02",
                icon: Sparkles,
                title: "Generate your chart",
                text: "The calculation produces your unique bodygraph.",
              },
              {
                n: "03",
                icon: Brain,
                title: "Explore your reading",
                text: "Start free, then unlock deeper interpretation if you want it.",
              },
            ].map(step => {
              const Icon = step.icon;
              return (
                <div key={step.n} className="rounded-[24px] border border-white/10 bg-white/[0.045] p-6 md:p-7">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-3xl text-[#F4C762]">{step.n}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4C762]/10 text-[#F4C762]">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-7 font-serif text-2xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/62">{step.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-3 sm:p-5">
            {[
              [CalendarDays, "Date of birth", "May 14, 1990"],
              [Clock3, "Time of birth", "14:37"],
              [MapPin, "Place of birth", "Austin, Texas"],
            ].map(([Icon, label, value]) => {
              const FieldIcon = Icon as typeof CalendarDays;
              return (
                <div key={String(label)} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-[#0D2442] px-4 py-4">
                  <FieldIcon className="h-4 w-4 text-[#F4C762]" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/42">{String(label)}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{String(value)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link
              href={localePath("/calculate")}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#F4C762] px-8 py-4 font-extrabold text-[#071426] transition hover:bg-[#FFE09A]"
            >
              Get My Free Chart <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F3EA] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-[1280px] gap-8 lg:grid-cols-2">
          <div className="rounded-[28px] border border-[#DDD6C8] bg-white p-7 shadow-sm md:p-9">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#071426] text-[#F4C762]">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B07A20]">Deep Reading</p>
                <h3 className="font-serif text-3xl text-[#071426]">A premium report built from your chart.</h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-[#66707D]">
              Go beyond the free overview with a structured, personalized report focused on your type,
              authority, profile, relationships and practical reflection.
            </p>
            <Link href={localePath("/honorace") + "#blueprint"} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#8A5B15]">
              Explore the Deep Reading <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[28px] border border-[#1B3558] bg-[#0D2442] p-7 text-white shadow-sm md:p-9">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4C762]/10 text-[#F4C762]">
                <Heart className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F4C762]">Ongoing guidance</p>
                <h3 className="font-serif text-3xl">Keep exploring with your chart over time.</h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/62">
              Daily transits, saved charts, relationship tools and optional AI guidance turn a one-time
              calculation into an ongoing self-reflection workspace.
            </p>
            <Link href={localePath("/honorace")} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#F4C762]">
              See premium options <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#071426] px-5 py-10 text-white md:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">HumanDesignChart.app</p>
            <p className="mt-1 text-xs text-white/46">A self-discovery and reflection tool. Not medical or financial advice.</p>
          </div>
          <div className="flex flex-wrap gap-5 text-xs text-white/56">
            <Link href={localePath("/blog")}>Journal</Link>
            <Link href={localePath("/honorace")}>Pricing</Link>
            <Link href={localePath("/calculate")}>Free Chart</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
