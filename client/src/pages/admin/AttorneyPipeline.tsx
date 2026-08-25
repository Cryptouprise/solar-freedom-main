import { useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, CheckCircle2, Clock3, ExternalLink, FilePenLine, Linkedin, Loader2, Mail, MapPin, Phone, Play, RefreshCw, Search, ShieldCheck, Star, Users } from "lucide-react";

const COLUMNS = [
  { key: "not_contacted", label: "Prospects", hint: "Verified firms awaiting review", color: "border-slate-500/30" },
  { key: "researching", label: "Researching", hint: "Evidence is being gathered", color: "border-blue-500/30" },
  { key: "ready_to_pitch", label: "Ready to pitch", hint: "Qualified for outreach review", color: "border-amber-500/30" },
  { key: "pitched", label: "Contacted", hint: "Outreach logged", color: "border-purple-500/30" },
  { key: "in_conversation", label: "In conversation", hint: "Partnership discussion", color: "border-cyan-500/30" },
  { key: "signed", label: "Signed", hint: "Ready for lead delivery", color: "border-emerald-500/30" },
] as const;

type Prospect = {
  id: number;
  firmName: string;
  contactPerson: string | null;
  state: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  practiceAreas: string | null;
  overallScore: number;
  qualityTier: "unreviewed" | "priority" | "review" | "defer";
  qualityConfidence: number;
  qualityExplanation: string | null;
  qualityGates: string | null;
  qualityReviewedAt: Date | null;
  outreachStatus: typeof COLUMNS[number]["key"] | "rejected" | "not_interested";
  outreachNotes: string | null;
  pitchAngle: string | null;
  discoveredVia: string | null;
  sourceUrl: string | null;
  linkedInSearchUrl: string | null;
  linkedInProfileUrl: string | null;
  linkedInResearchStatus: "not_started" | "research_ready" | "verified" | "not_found";
  linkedInOutreachStatus: "not_ready" | "drafted" | "approved" | "sent" | "replied" | "not_a_fit";
  linkedInDraft: string | null;
  discoveredBy: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
};

function scoreClass(score: number) {
  if (score >= 70) return "text-emerald-300 bg-emerald-500/10 border-emerald-500/25";
  if (score >= 45) return "text-amber-300 bg-amber-500/10 border-amber-500/25";
  return "text-slate-300 bg-slate-500/10 border-slate-500/25";
}

function safeUrl(url: string | null) {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

function ProspectCard({ prospect, onMove, onReview, onDraft, onApprove, onVerifyLinkedIn }: { prospect: Prospect; onMove: (id: number, status: Prospect["outreachStatus"]) => void; onReview: (id: number) => void; onDraft: (id: number) => void; onApprove: (id: number) => void; onVerifyLinkedIn: (id: number, url: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [profileUrl, setProfileUrl] = useState(prospect.linkedInProfileUrl || "");
  const columnIndex = COLUMNS.findIndex(c => c.key === prospect.outreachStatus);
  const next = columnIndex >= 0 ? COLUMNS[columnIndex + 1] : undefined;
  const source = prospect.discoveredVia || "No evidence source recorded";

  return (
    <article className="rounded-xl bg-[#171a21] border border-white/8 p-3 space-y-3 shadow-sm">
      <div className="flex gap-2 justify-between items-start">
        <div className="min-w-0">
          <h3 className="text-white text-sm font-semibold leading-tight line-clamp-2">{prospect.firmName}</h3>
          <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />{[prospect.city, prospect.state].filter(Boolean).join(", ") || "Location unverified"}
          </p>
        </div>
        <Badge className={`shrink-0 text-xs border ${scoreClass(Number(prospect.overallScore || 0))}`}>
          {Number(prospect.overallScore || 0)}/100
        </Badge>
      </div>

      <div className="text-[11px] text-gray-500 rounded bg-white/[0.03] px-2 py-1.5">
        <span className="text-gray-600">Evidence: </span>{source}
        {prospect.verifiedAt ? <span className="text-emerald-400"> · verified {new Date(prospect.verifiedAt).toLocaleDateString()}</span> : <span className="text-amber-400"> · unverified</span>}
        {safeUrl(prospect.sourceUrl) && <a href={safeUrl(prospect.sourceUrl)!} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-sky-300 hover:text-sky-200">Open source <ExternalLink className="w-3 h-3" /></a>}
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-white/5 pt-2 text-xs">
          {prospect.contactPerson && <p className="text-gray-300"><Users className="w-3 h-3 inline mr-1 text-gray-500" />{prospect.contactPerson}</p>}
          {prospect.email && <p className="text-gray-300 truncate"><Mail className="w-3 h-3 inline mr-1 text-gray-500" />{prospect.email}</p>}
          {prospect.phone && <p className="text-gray-300"><Phone className="w-3 h-3 inline mr-1 text-gray-500" />{prospect.phone}</p>}
          {prospect.practiceAreas && <p className="text-gray-400"><span className="text-gray-600">Practice:</span> {prospect.practiceAreas}</p>}
          {prospect.pitchAngle && <p className="text-amber-100/80 leading-relaxed"><span className="text-amber-400">Suggested pitch:</span> {prospect.pitchAngle}</p>}
          {prospect.outreachNotes && <p className="text-gray-400 whitespace-pre-wrap"><span className="text-gray-600">Notes:</span> {prospect.outreachNotes}</p>}
          <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.04] p-2.5 space-y-2">
            <div className="flex justify-between gap-2"><span className="font-semibold text-amber-200 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />Quality matrix</span><span className="text-amber-300 capitalize">{prospect.qualityTier.replace("_", " ")} · {prospect.qualityConfidence || 0}% confidence</span></div>
            <p className="text-gray-400 leading-relaxed">{prospect.qualityExplanation || "Not reviewed yet. This checks public evidence and outreach readiness; it does not assume the firm accepts referrals."}</p>
            {prospect.qualityGates && (() => { try { return JSON.parse(prospect.qualityGates).map((gate: { label: string; status: string; reason: string }) => <p key={gate.label} className="text-[11px] text-gray-500"><span className={gate.status === "pass" ? "text-emerald-300" : "text-amber-300"}>{gate.status.replace("_", " ")}</span> · <span className="text-gray-300">{gate.label}:</span> {gate.reason}</p>); } catch { return null; } })()}
          </div>
          <div className="rounded-lg border border-sky-500/15 bg-sky-500/[0.04] p-2.5 space-y-2">
            <div className="font-semibold text-sky-200 flex items-center gap-1"><Linkedin className="w-3.5 h-3.5" />LinkedIn research</div>
            <p className="text-gray-500">Open a manual search, verify the decision-maker yourself, then save the public profile link. LinkedIn is never scraped.</p>
            <div className="flex gap-2 flex-wrap">
              {safeUrl(prospect.linkedInSearchUrl) && <a href={safeUrl(prospect.linkedInSearchUrl)!} target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200 inline-flex items-center gap-1">Search LinkedIn <ExternalLink className="w-3 h-3" /></a>}
              {safeUrl(prospect.linkedInProfileUrl) && <a href={safeUrl(prospect.linkedInProfileUrl)!} target="_blank" rel="noreferrer" className="text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1">Verified profile <ExternalLink className="w-3 h-3" /></a>}
            </div>
            <div className="flex gap-2"><input value={profileUrl} onChange={event => setProfileUrl(event.target.value)} placeholder="Paste verified LinkedIn profile URL" className="min-w-0 flex-1 rounded border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-white placeholder:text-gray-600" /><Button size="sm" variant="outline" className="h-7 border-sky-500/25 text-sky-200" onClick={() => onVerifyLinkedIn(prospect.id, profileUrl)}>Save</Button></div>
          </div>
          {prospect.linkedInDraft && <div className="rounded-lg border border-violet-500/15 bg-violet-500/[0.04] p-2.5"><div className="font-semibold text-violet-200 flex items-center gap-1 mb-1"><FilePenLine className="w-3.5 h-3.5" />Review-only LinkedIn draft</div><p className="whitespace-pre-wrap text-gray-300 leading-relaxed">{prospect.linkedInDraft}</p><p className="text-[11px] text-gray-500 mt-2">Status: <span className="text-violet-200">{prospect.linkedInOutreachStatus.replaceAll("_", " ")}</span>. Approval never sends a message.</p></div>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button className="text-xs text-gray-500 hover:text-white" onClick={() => setExpanded(v => !v)}>{expanded ? "Less" : "Details"}</button>
        {safeUrl(prospect.website) && <a href={safeUrl(prospect.website)!} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">Site <ExternalLink className="w-3 h-3" /></a>}
        <div className="flex-1" />
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-amber-500/25 text-amber-200" onClick={() => onReview(prospect.id)}><ShieldCheck className="w-3 h-3 mr-1" />Review</Button>
        {["priority", "review"].includes(prospect.qualityTier) && <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-violet-500/25 text-violet-200" onClick={() => onDraft(prospect.id)}><FilePenLine className="w-3 h-3 mr-1" />Draft</Button>}
        {prospect.linkedInOutreachStatus === "drafted" && <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-emerald-500/25 text-emerald-200" onClick={() => onApprove(prospect.id)}><CheckCircle2 className="w-3 h-3 mr-1" />Approve</Button>}
        {next && <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-white/10 hover:bg-amber-500/10 hover:text-amber-300" onClick={() => onMove(prospect.id, next.key)}>{next.label} →</Button>}
      </div>
    </article>
  );
}

export default function AttorneyPipeline() {
  const utils = trpc.useUtils();
  const { data: attorneys = [], isLoading } = trpc.agents.listAttorneys.useQuery();
  const { data: moneyMakerHistory = [] } = trpc.agents.chatThreads.useQuery({ agentSlug: "money_maker", limit: 10 });
  const [selectedStates, setSelectedStates] = useState<string[]>(["California", "Texas", "Florida"]);
  const [crmPreview, setCrmPreview] = useState<any>(null);
  const latestRefresh = moneyMakerHistory.find(entry => entry.message.startsWith("Public-source refresh completed:"));

  const update = trpc.agents.updateAttorney.useMutation({
    onSuccess: () => {
      utils.agents.listAttorneys.invalidate();
      toast.success("Prospect moved and timestamped");
    },
    onError: (error) => toast.error(error.message),
  });
  const qualityReview = trpc.agents.reviewAttorneyQuality.useMutation({
    onSuccess: result => { utils.agents.listAttorneys.invalidate(); toast.success(`Quality review complete: ${result.review.tier} · ${result.review.score}/100`); },
    onError: error => toast.error(error.message),
  });
  const draftLinkedIn = trpc.agents.draftLinkedInOutreach.useMutation({
    onSuccess: () => { utils.agents.listAttorneys.invalidate(); toast.success("LinkedIn draft saved for your review. Nothing was sent."); },
    onError: error => toast.error(error.message),
  });
  const approveLinkedIn = trpc.agents.approveLinkedInOutreach.useMutation({
    onSuccess: () => { utils.agents.listAttorneys.invalidate(); toast.success("Draft approved. It remains unsent until you use an authorized LinkedIn workflow."); },
    onError: error => toast.error(error.message),
  });
  const updateLinkedIn = trpc.agents.updateLinkedInResearch.useMutation({
    onSuccess: () => { utils.agents.listAttorneys.invalidate(); toast.success("LinkedIn research status saved."); },
    onError: error => toast.error(error.message),
  });
  const research = trpc.agents.runAttorneyResearch.useMutation({
    onSuccess: (result) => {
      utils.agents.listAttorneys.invalidate();
      if (result.status === "blocked") {
        toast.error(result.blockedReason || "Attorney research is currently blocked. No prospects were created.");
        return;
      }
      toast.success(`Research complete: ${result.saved} verified prospects added from ${result.states.join(", ") || "selected states"}; ${result.duplicates} duplicates skipped.`);
    },
    onError: (error) => toast.error(error.message),
  });
  const contactPreview = trpc.agents.assistableContactDryRun.useMutation({
    onSuccess: result => setCrmPreview(result),
    onError: error => toast.error(error.message),
  });
  const testAssistable = trpc.agents.testAssistableConnection.useMutation({
    onSuccess: result => toast.success(`Assistable connected. Read-only validation request: ${result.requestId || "complete"}`),
    onError: error => toast.error(error.message),
  });

  const prospects = attorneys as Prospect[];
  const grouped = useMemo(() => Object.fromEntries(COLUMNS.map(c => [c.key, prospects.filter(p => p.outreachStatus === c.key)])), [prospects]);
  const scoreAverage = prospects.length ? Math.round(prospects.reduce((sum, p) => sum + Number(p.overallScore || 0), 0) / prospects.length) : 0;
  const priorityQueue = useMemo(() => prospects
    .filter(prospect => prospect.qualityTier === "priority")
    .sort((a, b) => Number(b.overallScore || 0) - Number(a.overallScore || 0) || Number(b.qualityConfidence || 0) - Number(a.qualityConfidence || 0)), [prospects]);

  function toggleState(state: string) {
    setSelectedStates(current => current.includes(state) ? current.filter(s => s !== state) : [...current, state]);
  }

  return (
    <AdminLayout title="Attorney Pipeline" subtitle="Evidence-backed attorney prospecting, partnership progress, and lead-buyer readiness">
      <div className="p-6 space-y-6">
        <section className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-[#171a21] to-[#111318] p-5">
          <div className="flex flex-col xl:flex-row gap-5 xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold"><Building2 className="w-4 h-4" />Money Maker execution board</div>
              <h1 className="text-white text-2xl font-bold mt-1">Attorney partnerships that turn leads into revenue</h1>
              <p className="text-gray-400 text-sm mt-2 max-w-3xl">Every card must show its source, verification state, score, and pipeline movement. This board does not claim that a firm was contacted unless an outreach event was actually logged.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="rounded-xl bg-black/20 border border-white/5 px-4 py-3"><div className="text-gray-500 text-[10px] uppercase tracking-wider">Prospects</div><div className="text-white font-mono text-xl mt-1">{prospects.length}</div></div>
              <div className="rounded-xl bg-black/20 border border-white/5 px-4 py-3"><div className="text-gray-500 text-[10px] uppercase tracking-wider">Signed</div><div className="text-emerald-300 font-mono text-xl mt-1">{grouped.signed?.length || 0}</div></div>
              <div className="rounded-xl bg-black/20 border border-white/5 px-4 py-3"><div className="text-gray-500 text-[10px] uppercase tracking-wider">Avg. score</div><div className="text-amber-300 font-mono text-xl mt-1">{scoreAverage}</div></div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-sky-500/10 p-2 text-sky-300"><RefreshCw className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sky-100">Latest public contact refresh</p>
              {latestRefresh ? <>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{latestRefresh.message}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3 w-3" />{new Date(latestRefresh.createdAt).toLocaleString()}</p>
              </> : <p className="mt-1 text-sm text-slate-400">No contact-refresh receipt has been recorded yet. Scheduled refreshes never send outreach.</p>}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-white font-semibold flex items-center gap-2"><Star className="w-4 h-4 text-emerald-300" />Start here tomorrow — direct-solar priority queue</h2>
              <p className="text-gray-400 text-xs mt-1">These firms passed the direct-solar evidence gate: public source, a solar-practice signal, and a public route to reach the firm. This is a research ranking—not proof they buy leads or accept referrals.</p>
            </div>
            <Badge className="w-fit border-emerald-500/30 bg-emerald-500/10 text-emerald-200">{priorityQueue.length} priority prospects</Badge>
          </div>
          {priorityQueue.length ? <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {priorityQueue.map((prospect, index) => <article key={prospect.id} className="rounded-lg border border-emerald-500/15 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-2"><div><p className="text-[11px] font-mono text-emerald-300">#{index + 1} · {Number(prospect.overallScore || 0)}/100</p><h3 className="mt-1 text-sm font-semibold text-white">{prospect.firmName}</h3><p className="mt-0.5 text-xs text-gray-500">{prospect.contactPerson || "Decision-maker research needed"} · {[prospect.city, prospect.state].filter(Boolean).join(", ")}</p></div><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" /></div>
              <div className="mt-3 space-y-1 text-xs text-gray-300">{prospect.phone && <p><Phone className="mr-1 inline h-3 w-3 text-gray-500" />{prospect.phone}</p>}{prospect.email && <p className="truncate"><Mail className="mr-1 inline h-3 w-3 text-gray-500" />{prospect.email}</p>}</div>
              <div className="mt-3 flex flex-wrap gap-2">{safeUrl(prospect.sourceUrl) && <a href={safeUrl(prospect.sourceUrl)!} target="_blank" rel="noreferrer" className="text-xs text-sky-300 hover:text-sky-200">Evidence ↗</a>}{safeUrl(prospect.linkedInSearchUrl) && <a href={safeUrl(prospect.linkedInSearchUrl)!} target="_blank" rel="noreferrer" className="text-xs text-violet-300 hover:text-violet-200">LinkedIn lookup ↗</a>}<button className="text-xs text-amber-200 hover:text-amber-100" onClick={() => draftLinkedIn.mutate({ id: prospect.id })}>Draft intro</button></div>
            </article>)}
          </div> : <p className="mt-3 text-xs text-gray-500">No prospect has passed the direct-solar priority gate yet.</p>}
        </section>

        <section className="rounded-xl border border-white/8 bg-[#151820] p-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div>
              <h2 className="text-white font-semibold flex items-center gap-2"><Search className="w-4 h-4 text-blue-400" />Research attorney prospects</h2>
              <p className="text-gray-500 text-xs mt-1">Runs research only. It does not email, text, call, or change voicemail. External contact requires a separately enabled CRM action.</p>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {["California", "Texas", "Florida", "Arizona", "Nevada"].map(state => (
                <button key={state} onClick={() => toggleState(state)} className={`px-2.5 py-1.5 rounded-md text-xs border transition-colors ${selectedStates.includes(state) ? "bg-blue-500/15 border-blue-500/30 text-blue-200" : "border-white/10 text-gray-500 hover:text-gray-300"}`}>{state}</button>
              ))}
              <Button disabled={research.isPending || !selectedStates.length} onClick={() => research.mutate({ states: selectedStates })} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                {research.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}Run research
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div>
              <h2 className="text-white font-semibold flex items-center gap-2"><Linkedin className="w-4 h-4 text-violet-300" />LinkedIn outreach — owner-approved only</h2>
              <p className="text-gray-400 text-xs mt-1 max-w-3xl">The pipeline can qualify a firm, create a manual LinkedIn search link, and draft a personalized introduction. It will never scrape LinkedIn or send a message on its own. Actual sending requires an authorized Taplio connection and your final confirmation.</p>
            </div>
            <a href="https://app.taplio.com" target="_blank" rel="noreferrer"><Button variant="outline" size="sm" className="border-violet-500/30 text-violet-200 hover:bg-violet-500/10"><Linkedin className="w-3 h-3 mr-1" />Connect Taplio</Button></a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-4 text-xs">
            {["1. Review evidence", "2. Verify profile", "3. Approve draft", "4. Confirm send"].map((step, index) => <div key={step} className="rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-gray-400"><span className="text-violet-300 font-mono mr-1">0{index + 1}</span>{step}</div>)}
          </div>
        </section>

        <section className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div>
              <h2 className="text-white font-semibold flex items-center gap-2"><Play className="w-4 h-4 text-cyan-300" />Assistable AI CRM — safe activation readiness</h2>
              <p className="text-gray-400 text-xs mt-1 max-w-3xl">The integration is installed in safe mode. It cannot call, text, email, enroll a campaign, or alter voicemail. Tomorrow, add the API key and subaccount ID, then use the read-only test before enabling any channel.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => contactPreview.mutate({ firstName: "Chase", email: "chasef1124@gmail.com", phone: "214-529-1531", companyName: "Solar Freedom" })} disabled={contactPreview.isPending} className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10">
                {contactPreview.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Search className="w-3 h-3 mr-1" />}Preview test contact
              </Button>
              <Button variant="outline" size="sm" onClick={() => testAssistable.mutate()} disabled={testAssistable.isPending} className="border-white/10 text-gray-300">
                {testAssistable.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}Read-only connection test
              </Button>
            </div>
          </div>
          {crmPreview && <div className="mt-3 rounded-lg border border-cyan-500/15 bg-black/20 px-3 py-2 text-xs text-cyan-100"><strong>Dry run only:</strong> {crmPreview.payload?.email || "No email"} · {crmPreview.payload?.phone || "No phone"} · DND: {String(crmPreview.payload?.dnd)}. No API request was made and no contact was created.</div>}
        </section>

        {isLoading ? <div className="py-24 flex justify-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading pipeline…</div> : (
          <section className="overflow-x-auto pb-3">
            <div className="grid grid-flow-col auto-cols-[280px] gap-4 min-w-max">
              {COLUMNS.map(column => (
                <div key={column.key} className={`rounded-xl border-t-2 ${column.color} bg-[#111318] p-3 min-h-[460px]`}>
                  <div className="mb-3"><div className="flex items-center justify-between"><h2 className="text-white font-semibold text-sm">{column.label}</h2><Badge variant="outline" className="text-gray-400 border-white/10">{grouped[column.key]?.length || 0}</Badge></div><p className="text-[11px] text-gray-600 mt-1">{column.hint}</p></div>
                  <div className="space-y-3">
                    {(grouped[column.key] || []).map(prospect => <ProspectCard key={prospect.id} prospect={prospect} onMove={(id, status) => update.mutate({ id, outreachStatus: status })} onReview={id => qualityReview.mutate({ id })} onDraft={id => draftLinkedIn.mutate({ id })} onApprove={id => approveLinkedIn.mutate({ id })} onVerifyLinkedIn={(id, profileUrl) => updateLinkedIn.mutate({ id, status: profileUrl ? "verified" : "research_ready", profileUrl: profileUrl || undefined })} />)}
                    {!grouped[column.key]?.length && <div className="rounded-lg border border-dashed border-white/10 px-3 py-8 text-center text-xs text-gray-600">No prospects in this stage.</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl border border-white/8 bg-[#151820] p-4 text-sm text-gray-400">
          <div className="flex items-center gap-2 text-white font-semibold"><Star className="w-4 h-4 text-amber-400" />What this agent can do today</div>
          <p className="mt-2 leading-relaxed">It can create and rank research work, preserve evidence, prioritize the best partnership opportunities, draft approved outreach, and track delivery/revenue outcomes. It is intentionally prevented from texting, calling, or emailing until the CRM connection and explicit sending rules are enabled.</p>
        </section>
      </div>
    </AdminLayout>
  );
}
