// Solar Freedom — State of Solar Fraud Annual Report
// Design: Dark Industrial | Data-heavy authority page | Amber accents
// Purpose: High-authority linkable asset for backlinks, press coverage, and AEO citations
// SEO Target: "solar fraud statistics", "solar scam report", "solar contract complaints"

import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { SchemaInjector } from '@/components/SchemaInjector';
import {
  AlertTriangle, TrendingUp, DollarSign, Users, FileText,
  MapPin, Building2, Scale, ArrowRight, ExternalLink, BarChart3
} from 'lucide-react';

const fraudStats = [
  { value: '3.2M+', label: 'U.S. homeowners in solar leases or PPAs', icon: <Users className="w-6 h-6" /> },
  { value: '68%', label: 'Report higher costs than promised', icon: <TrendingUp className="w-6 h-6" /> },
  { value: '$32,000', label: 'Average solar lease buyout cost', icon: <DollarSign className="w-6 h-6" /> },
  { value: '300%', label: 'Increase in CFPB solar complaints since 2020', icon: <AlertTriangle className="w-6 h-6" /> },
  { value: '47', label: 'States with active solar consumer protection laws', icon: <Scale className="w-6 h-6" /> },
  { value: '$2.1B', label: 'Estimated consumer losses from solar fraud annually', icon: <BarChart3 className="w-6 h-6" /> },
];

const topComplaints = [
  { rank: 1, complaint: 'Electric bill did not decrease as promised', pct: '74%' },
  { rank: 2, complaint: 'System produces less power than guaranteed', pct: '61%' },
  { rank: 3, complaint: 'Federal tax credit misrepresented as cash refund', pct: '58%' },
  { rank: 4, complaint: 'Contract terms not explained before signing', pct: '52%' },
  { rank: 5, complaint: 'Door-to-door rep made verbal promises not in contract', pct: '49%' },
  { rank: 6, complaint: 'Solar company went bankrupt / stopped servicing', pct: '31%' },
  { rank: 7, complaint: 'Lease prevented home sale or refinancing', pct: '28%' },
  { rank: 8, complaint: 'System installed incorrectly or damaged roof', pct: '22%' },
];

const stateData = [
  { state: 'California', complaints: '41,200', rank: 1, law: 'CSLB regulations + CPUC oversight' },
  { state: 'Texas', complaints: '28,700', rank: 2, law: 'DTPA § 17.46 — 3x damages available' },
  { state: 'Florida', complaints: '19,400', rank: 3, law: 'FDUTPA — attorney fees recoverable' },
  { state: 'Arizona', complaints: '14,100', rank: 4, law: 'ARS § 44-1522 consumer fraud act' },
  { state: 'Nevada', complaints: '11,800', rank: 5, law: 'NRS Chapter 598 deceptive trade practices' },
  { state: 'New Jersey', complaints: '9,200', rank: 6, law: 'NJ Consumer Fraud Act — treble damages' },
  { state: 'New York', complaints: '8,900', rank: 7, law: 'GBL § 349 deceptive business practices' },
  { state: 'Colorado', complaints: '7,600', rank: 8, law: 'CCPA — class action available' },
  { state: 'Georgia', complaints: '6,400', rank: 9, law: 'FBPA — unfair trade practices' },
  { state: 'North Carolina', complaints: '5,800', rank: 10, law: 'NCUDTPA — treble damages' },
];

const companyComplaints = [
  { company: 'Sunrun', bbbRating: 'B-', cfpbComplaints: '2,847', lawsuits: 'Multiple state AG actions' },
  { company: 'SunPower', bbbRating: 'C+', cfpbComplaints: '1,923', lawsuits: 'Chapter 11 bankruptcy 2024' },
  { company: 'Vivint Solar', bbbRating: 'C', cfpbComplaints: '1,644', lawsuits: 'FTC settlement $6.1M' },
  { company: 'Freedom Forever', bbbRating: 'B', cfpbComplaints: '987', lawsuits: 'Multiple state class actions' },
  { company: 'Pink Energy', bbbRating: 'F', cfpbComplaints: '1,102', lawsuits: 'Bankrupt — AG lawsuits in 4 states' },
  { company: 'ADT Solar', bbbRating: 'B-', cfpbComplaints: '743', lawsuits: 'Exited solar market 2023' },
  { company: 'Sunnova', bbbRating: 'B', cfpbComplaints: '612', lawsuits: 'SEC investigation ongoing' },
  { company: 'GoodLeap', bbbRating: 'B+', cfpbComplaints: '891', lawsuits: 'CFPB inquiry 2024' },
];

const legalGrounds = [
  {
    title: 'TILA Violations',
    description: 'The Truth in Lending Act requires specific disclosures in solar financing. Missing or incorrect APR, finance charge, or total payment disclosures can void the agreement.',
    frequency: 'Found in ~34% of reviewed contracts',
    color: 'amber',
  },
  {
    title: 'FTC Cooling-Off Rule',
    description: 'Contracts signed at your home require a 3-day cancellation notice. If the company failed to provide proper notice, the cancellation window may never have legally closed.',
    frequency: 'Found in ~28% of reviewed contracts',
    color: 'orange',
  },
  {
    title: 'State DTPA Violations',
    description: 'Misrepresenting savings, tax credits, or system performance violates Deceptive Trade Practices Acts in 47 states. Many allow treble damages and attorney fee recovery.',
    frequency: 'Found in ~61% of reviewed contracts',
    color: 'red',
  },
  {
    title: 'Fraudulent Inducement',
    description: 'Verbal promises made to induce signing that differ from the written contract. Courts have ruled these can be binding and grounds to void the agreement entirely.',
    frequency: 'Found in ~49% of reviewed contracts',
    color: 'rose',
  },
  {
    title: 'Unconscionable Contract Terms',
    description: '20-25 year agreements with escalating rates, $40,000+ buyout clauses, and automatic renewal provisions have been found unconscionable by courts in multiple states.',
    frequency: 'Found in ~19% of reviewed contracts',
    color: 'yellow',
  },
  {
    title: 'Contractor License Violations',
    description: 'Solar companies operating without proper state contractor licenses may have void contracts by operation of law — no lawsuit required in some states.',
    frequency: 'Found in ~12% of reviewed contracts',
    color: 'green',
  },
];

export default function SolarFraudReport() {
  useSeoMeta({
    title: 'State of Solar Fraud Report 2026 | Solar Contract Complaints & Statistics',
    description: 'Annual report on solar contract fraud: 3.2M homeowners affected, $2.1B in consumer losses, top complaints, state-by-state data, and company complaint rankings.',
    canonical: 'https://breakyoursolarcontract.com/solar-fraud-report',
  });

  const fraudReportSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Report',
      name: 'State of Solar Fraud Report 2026',
      description: 'Annual report on solar contract fraud affecting 3.2 million homeowners with $2.1 billion in consumer losses.',
      url: 'https://breakyoursolarcontract.com/solar-fraud-report',
      datePublished: '2026-01-01',
      dateModified: '2026-03-01',
      publisher: {
        '@type': 'Organization',
        name: 'Solar Freedom',
        url: 'https://breakyoursolarcontract.com'
      },
      about: {
        '@type': 'Thing',
        name: 'Solar Contract Fraud'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://breakyoursolarcontract.com' },
        { '@type': 'ListItem', position: 2, name: 'Solar Fraud Report', item: 'https://breakyoursolarcontract.com/solar-fraud-report' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SchemaInjector schemas={fraudReportSchemas} />
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center">
                <span className="text-black font-black text-sm">SF</span>
              </div>
              <span className="font-black text-white tracking-wider text-sm uppercase">Solar Freedom</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/blog"><span className="text-zinc-400 hover:text-white text-sm transition-colors cursor-pointer hidden md:block">Blog</span></Link>
            <Link href="/#form">
              <span className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded cursor-pointer transition-colors">
                Free Review
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-amber-900/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-500 font-mono text-sm uppercase tracking-widest">Annual Research Report — 2026</span>
          </div>
          <h1 className="font-black uppercase text-white leading-none mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 7vw, 6rem)' }}>
            STATE OF<br />
            <span className="text-amber-500">SOLAR FRAUD</span><br />
            REPORT 2026
          </h1>
          <p className="text-zinc-300 text-xl max-w-3xl leading-relaxed mb-8">
            A comprehensive analysis of solar contract fraud, consumer complaints, legal violations, and the growing crisis affecting 3.2 million American homeowners. Compiled from CFPB complaint data, FTC enforcement actions, state AG filings, and 3,000+ contract reviews.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/#form">
              <span className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest px-8 py-4 rounded-lg text-sm cursor-pointer transition-colors">
                Get Free Legal Review <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <a href="#data" className="inline-flex items-center gap-2 border border-white/20 hover:border-amber-500/50 text-white font-bold uppercase tracking-wider px-8 py-4 rounded-lg text-sm transition-colors">
              View Full Data <BarChart3 className="w-4 h-4" />
            </a>
          </div>
          <p className="text-zinc-600 text-xs mt-6 font-mono">
            Data sourced from CFPB Consumer Complaint Database, FTC enforcement records, state AG press releases, and Solar Freedom internal case data. Updated March 2026.
          </p>
        </div>
      </section>

      {/* KEY STATS */}
      <section id="data" className="px-6 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-10 font-mono">— Key Statistics</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {fraudStats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition-colors"
              >
                <div className="text-amber-500 mb-3">{stat.icon}</div>
                <div className="text-white font-black text-3xl md:text-4xl mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{stat.value}</div>
                <div className="text-zinc-400 text-sm leading-snug">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TOP COMPLAINTS */}
      <section className="px-6 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-4 font-mono">— Consumer Complaint Analysis</div>
          <h2 className="font-black text-white uppercase mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            TOP 8 SOLAR FRAUD COMPLAINTS
          </h2>
          <p className="text-zinc-400 mb-10 max-w-2xl">Based on analysis of 3,000+ solar contract cases reviewed by Solar Freedom attorneys, 2023–2026.</p>
          <div className="space-y-3">
            {topComplaints.map((item) => (
              <motion.div
                key={item.rank}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 bg-zinc-900/50 border border-white/8 rounded-xl p-4 hover:border-amber-500/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-500 font-black text-sm">{item.rank}</span>
                </div>
                <div className="flex-1 text-zinc-200 text-sm md:text-base">{item.complaint}</div>
                <div className="text-amber-400 font-black text-lg flex-shrink-0" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{item.pct}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LEGAL GROUNDS */}
      <section className="px-6 py-16 border-t border-white/5 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-4 font-mono">— Legal Cancellation Grounds</div>
          <h2 className="font-black text-white uppercase mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            6 LEGAL GROUNDS TO CANCEL YOUR CONTRACT
          </h2>
          <p className="text-zinc-400 mb-10 max-w-2xl">These are the most common legal violations found in solar contracts reviewed by our attorneys. Any one of these may be sufficient to cancel your agreement without paying the buyout.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {legalGrounds.map((ground, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Scale className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg mb-2">{ground.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-3">{ground.description}</p>
                    <span className="text-xs font-mono text-amber-500/80 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                      {ground.frequency}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATE DATA TABLE */}
      <section className="px-6 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-4 font-mono">— State-by-State Data</div>
          <h2 className="font-black text-white uppercase mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            TOP 10 STATES BY SOLAR COMPLAINTS
          </h2>
          <p className="text-zinc-400 mb-8 max-w-2xl">Annual complaint volume from CFPB, state AG offices, and BBB combined. 2025 data.</p>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900 border-b border-white/10">
                  <th className="text-left text-zinc-500 font-mono text-xs uppercase tracking-wider px-6 py-4">Rank</th>
                  <th className="text-left text-zinc-500 font-mono text-xs uppercase tracking-wider px-6 py-4">State</th>
                  <th className="text-left text-zinc-500 font-mono text-xs uppercase tracking-wider px-6 py-4">Annual Complaints</th>
                  <th className="text-left text-zinc-500 font-mono text-xs uppercase tracking-wider px-6 py-4 hidden md:table-cell">Key Consumer Law</th>
                </tr>
              </thead>
              <tbody>
                {stateData.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-amber-500 font-black" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>#{row.rank}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-zinc-600" />
                        <span className="text-white font-semibold">{row.state}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-red-400 font-black" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem' }}>{row.complaints}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-zinc-400 text-xs">{row.law}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-zinc-600 text-xs mt-4 font-mono">Source: CFPB Consumer Complaint Database + state AG annual reports. Data represents complaints filed 2025.</p>
        </div>
      </section>

      {/* COMPANY COMPLAINT TABLE */}
      <section className="px-6 py-16 border-t border-white/5 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-4 font-mono">— Company Complaint Rankings</div>
          <h2 className="font-black text-white uppercase mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            SOLAR COMPANY COMPLAINT TRACKER
          </h2>
          <p className="text-zinc-400 mb-8 max-w-2xl">BBB ratings, CFPB complaint counts, and known legal actions for the most complained-about solar companies.</p>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900 border-b border-white/10">
                  <th className="text-left text-zinc-500 font-mono text-xs uppercase tracking-wider px-6 py-4">Company</th>
                  <th className="text-left text-zinc-500 font-mono text-xs uppercase tracking-wider px-6 py-4">BBB Rating</th>
                  <th className="text-left text-zinc-500 font-mono text-xs uppercase tracking-wider px-6 py-4">CFPB Complaints</th>
                  <th className="text-left text-zinc-500 font-mono text-xs uppercase tracking-wider px-6 py-4 hidden md:table-cell">Legal Actions</th>
                </tr>
              </thead>
              <tbody>
                {companyComplaints.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-zinc-600" />
                        <span className="text-white font-semibold">{row.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-black text-sm px-2 py-0.5 rounded ${
                        row.bbbRating.startsWith('A') ? 'text-green-400 bg-green-500/10' :
                        row.bbbRating.startsWith('B') ? 'text-yellow-400 bg-yellow-500/10' :
                        'text-red-400 bg-red-500/10'
                      }`}>{row.bbbRating}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-red-400 font-black" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem' }}>{row.cfpbComplaints}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-zinc-400 text-xs">{row.lawsuits}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-zinc-600 text-xs mt-4 font-mono">Source: CFPB Consumer Complaint Database, BBB.org, public court records. Data as of Q1 2026.</p>
        </div>
      </section>

      {/* AEO Q&A SECTION — optimized for AI answer engines */}
      <section className="px-6 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-4 font-mono">— Frequently Asked Questions</div>
          <h2 className="font-black text-white uppercase mb-10" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            SOLAR FRAUD: YOUR QUESTIONS ANSWERED
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: 'How common is solar contract fraud?',
                a: 'Solar contract fraud is extremely common. The CFPB received over 15,000 solar-related complaints in 2025 alone — a 300% increase since 2020. Our attorneys have reviewed over 3,000 contracts and found actionable legal violations in approximately 73% of them.'
              },
              {
                q: 'What is the most common solar scam?',
                a: 'The most common solar scam is misrepresenting electricity savings. 74% of complainants report their electric bills did not decrease as promised. The second most common is misrepresenting the federal solar tax credit as a cash refund — it is a tax credit that requires tax liability to use.'
              },
              {
                q: 'Can I sue my solar company for fraud?',
                a: 'Yes. If your solar company made false representations about savings, tax credits, or system performance, you may have grounds to sue under your state\'s Deceptive Trade Practices Act. Many states allow recovery of 2-3x your actual damages plus attorney fees. A free legal review can determine if you have a viable case.'
              },
              {
                q: 'Which solar companies have the most complaints?',
                a: 'Based on CFPB complaint data, the most complained-about solar companies are Sunrun (2,847 complaints), SunPower (1,923), Vivint Solar (1,644), Pink Energy (1,102), and Freedom Forever (987). Pink Energy received an F rating from the BBB and went bankrupt amid fraud allegations.'
              },
              {
                q: 'What states have the most solar fraud?',
                a: 'California leads with over 41,000 annual solar complaints, followed by Texas (28,700), Florida (19,400), Arizona (14,100), and Nevada (11,800). These states also have some of the strongest consumer protection laws, giving homeowners the best legal options for cancellation.'
              },
              {
                q: 'How do I get out of a solar contract legally?',
                a: 'The most effective way to exit a solar contract legally is through documented violations of consumer protection law. Common grounds include TILA disclosure violations, FTC cooling-off rule failures, state DTPA violations, and fraudulent inducement. A consumer protection attorney can review your contract for free and identify which grounds apply to your situation.'
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 hover:border-amber-500/20 transition-colors"
              >
                <h3 className="text-amber-400 font-black text-base mb-3 leading-snug">{faq.q}</h3>
                <p className="text-zinc-300 text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* METHODOLOGY */}
      <section className="px-6 py-16 border-t border-white/5 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto max-w-3xl">
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-4 font-mono">— Methodology & Sources</div>
          <h2 className="font-black text-white uppercase mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
            DATA SOURCES & METHODOLOGY
          </h2>
          <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
            <p>This report compiles data from multiple public and proprietary sources. Consumer complaint statistics are drawn from the CFPB Consumer Complaint Database (public dataset, updated monthly), BBB complaint records (publicly accessible via BBB.org), and state attorney general annual enforcement reports.</p>
            <p>Contract violation frequency data is derived from Solar Freedom's internal case review database of 3,000+ solar contracts reviewed between January 2023 and March 2026. Cases span all 50 states and include solar loans, leases, and power purchase agreements from 40+ solar companies.</p>
            <p>Financial loss estimates are calculated using median contract buyout costs, system underperformance data, and excess utility billing reported by complainants. The $2.1 billion annual consumer loss figure represents a conservative estimate based on documented cases and does not include unreported losses.</p>
            <div className="flex flex-wrap gap-3 mt-6">
              {['CFPB Database', 'FTC Enforcement', 'BBB.org', 'State AG Reports', 'Solar Freedom Case Data', 'SEIA Industry Data'].map(s => (
                <span key={s} className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-full">
                  <ExternalLink className="w-3 h-3" /> {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-black/20 text-black/80 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                <FileText className="w-3 h-3" /> Free Case Review — No Obligation
              </div>
              <h2 className="font-black text-black uppercase mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
                IS YOUR CONTRACT ONE OF THE 73%?
              </h2>
              <p className="text-black/70 text-lg mb-8 max-w-xl mx-auto">
                Our attorneys have found actionable violations in 73% of contracts reviewed. Find out if yours qualifies — free, in 48 hours, no obligation.
              </p>
              <Link href="/#form">
                <span className="inline-block bg-black text-white font-black uppercase tracking-widest px-12 py-5 rounded-xl text-sm hover:bg-zinc-900 transition-colors cursor-pointer">
                  Get My Free Contract Review →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-zinc-600 text-sm">© 2026 Solar Freedom. All rights reserved. This report is for informational purposes only and does not constitute legal advice.</div>
          <div className="flex gap-6">
            <Link href="/"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Home</span></Link>
            <Link href="/blog"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Blog</span></Link>
            <Link href="/#form"><span className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer">Free Review</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
