import { motion, useInView } from "framer-motion";
import { ClipboardCheck, FileSearch, FolderOpen, Route, ShieldCheck } from "lucide-react";
import { useRef } from "react";

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.55, delay }}
    >
      {children}
    </motion.div>
  );
}

const reviewAreas = [
  {
    icon: FileSearch,
    title: "What the agreement says",
    detail:
      "Identify the actual seller, installer, lender or lessor, payment schedule, transfer terms, performance language, notices, and dispute process.",
  },
  {
    icon: FolderOpen,
    title: "What the records show",
    detail:
      "Compare the signed documents with written sales representations, utility bills, production data, payment history, service records, and communications.",
  },
  {
    icon: Route,
    title: "Which paths need follow-up",
    detail:
      "Organize questions for the company, lender, servicer, regulator, title professional, or independent legal counsel. No path or result is presumed.",
  },
];

const recordsChecklist = [
  "Every signed agreement, addendum, disclosure, and cancellation notice",
  "Loan, lease, PPA, payment, payoff, transfer, and servicing records",
  "Sales messages, proposals, recordings, emails, and advertised savings",
  "Utility bills, monitoring exports, production data, and repair history",
  "Title records, UCC filings, insurance correspondence, and sale deadlines",
];

export default function OutcomesSection({ onBookCall }: { onBookCall?: () => void }) {
  return (
    <section className="bg-slate-950 py-24 text-slate-200 lg:py-32">
      <div className="container max-w-6xl space-y-16">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-amber-400">
              Document-first review
            </p>
            <h2 className="mt-5 font-display text-5xl leading-none text-white sm:text-6xl">
              Clarify the facts before choosing a path
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-400">
              A review can organize the agreement, evidence, parties, and unanswered questions. It cannot promise
              cancellation, a balance reduction, lien treatment, equipment ownership, credit treatment, a timeline,
              or representation.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {reviewAreas.map((area, index) => (
            <Reveal key={area.title} delay={index * 0.08}>
              <article className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-7">
                <area.icon className="h-7 w-7 text-amber-400" aria-hidden="true" />
                <h3 className="mt-5 text-xl font-bold text-white">{area.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{area.detail}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-7 sm:p-9">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-7 w-7 text-amber-300" aria-hidden="true" />
                <h3 className="text-2xl font-bold text-white">Records to gather</h3>
              </div>
              <ul className="mt-6 space-y-4">
                {recordsChecklist.map(item => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="h-full rounded-2xl border border-white/10 bg-slate-900 p-7 sm:p-9">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-7 w-7 text-emerald-400" aria-hidden="true" />
                <h3 className="text-2xl font-bold text-white">Verify with primary sources</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                Consumer rules and remedies depend on how and where a transaction occurred. Use current official
                sources and qualified, jurisdiction-specific advice before acting on a legal conclusion.
              </p>
              <nav aria-label="Official consumer resources" className="mt-6 space-y-3 text-sm">
                <a
                  className="block font-semibold text-amber-300 hover:text-amber-200"
                  href="https://consumer.ftc.gov/articles/buyers-remorse-ftcs-cooling-rule-may-help"
                  target="_blank"
                  rel="noreferrer"
                >
                  FTC: Cooling-Off Rule consumer guidance ↗
                </a>
                <a
                  className="block font-semibold text-amber-300 hover:text-amber-200"
                  href="https://www.consumerfinance.gov/complaint/"
                  target="_blank"
                  rel="noreferrer"
                >
                  CFPB: Consumer complaint process ↗
                </a>
                <a
                  className="block font-semibold text-amber-300 hover:text-amber-200"
                  href="https://www.usa.gov/state-attorney-general"
                  target="_blank"
                  rel="noreferrer"
                >
                  USA.gov: Find a state attorney general ↗
                </a>
              </nav>
            </div>
          </Reveal>
        </div>

        {onBookCall ? (
          <Reveal delay={0.1}>
            <div className="text-center">
              <p className="mx-auto mb-6 max-w-2xl text-sm leading-6 text-slate-400">
                Submit only the information needed to request an individual review. Submission does not create an
                attorney-client relationship or guarantee a response, service, fee, or outcome.
              </p>
              <button
                type="button"
                onClick={onBookCall}
                className="rounded-xl bg-amber-400 px-8 py-4 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:bg-amber-300"
              >
                Request a document review
              </button>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
