import { useState } from "react";
import { trpc } from "@/lib/trpc";
export default function ExternalAIAccess({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false), [name, setName] = useState("My outside AI");
  const keys = trpc.autopilot.externalKeys.useQuery(undefined, { enabled: enabled && open });
  const create = trpc.autopilot.createExternalKey.useMutation({ onSuccess: () => keys.refetch() });
  const revoke = trpc.autopilot.revokeExternalKey.useMutation({ onSuccess: () => keys.refetch() });
  const [copied, setCopied] = useState(false);
  return <section className="mt-4 rounded-lg border border-cyan-300/20 bg-black/20 p-3 text-xs"><button className="font-semibold text-cyan-200 underline" onClick={() => setOpen(value => !value)}>Connect another AI—no chat required for routine reviews and drafts</button>
    {open && <div className="mt-3 space-y-3"><p className="max-w-3xl text-gray-300">Give your AI its own revocable key. It can read articles/results/work status, upload managed images, request Argon screenshot reviews and save repair drafts. It cannot edit live articles, publish, delete, change routes, run SQL, access CRM records or change schedules. AI/model and hosting costs still apply.</p>
      <div className="flex flex-wrap gap-2"><input aria-label="External AI key label" value={name} maxLength={80} onChange={event => setName(event.target.value)} className="min-w-0 rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-white" /><button disabled={create.isPending || !name.trim()} onClick={() => { setCopied(false); create.mutate({ name }); }} className="rounded-lg bg-cyan-300 px-3 py-2 font-bold text-black disabled:opacity-50">{create.isPending ? "Creating limited key…" : "Create limited access key"}</button></div>
      {create.error && <p role="alert" className="text-red-200">{create.error.message}</p>}
      {create.data && <div className="rounded-lg border border-amber-300/30 p-3"><p className="text-amber-100">Copy this key once into your AI's secret manager. Do not put it in a GitHub repository, public chat, website JavaScript or screenshot.</p><input aria-label="New private API key" type="password" readOnly value={create.data.key} className="mt-2 w-full rounded bg-black p-2 font-mono text-gray-300" /><button className="mt-2 text-cyan-200 underline" onClick={async () => { await navigator.clipboard.writeText(create.data!.key); setCopied(true); }}>{copied ? "Copied" : "Copy private key"}</button><p className="mt-2 text-gray-400">Authorization: Bearer &lt;key&gt; · Base: https://breakyoursolarcontract.com/api/admin</p></div>}
      <a href="/api/capabilities.md" target="_blank" rel="noreferrer" className="block text-cyan-200 underline">Give your AI the current API instructions</a>
      {keys.data?.map(key => <div key={key.id} className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-2"><span className="text-gray-300">{key.name.replace("external-seo:", "")} · {key.keyPrefix}… · {key.active ? "active" : "revoked"}</span>{key.active === 1 && <button disabled={revoke.isPending} className="text-red-200 underline" onClick={() => revoke.mutate({ id: key.id })}>Revoke access</button>}</div>)}
      {(keys.error || revoke.error) && <p role="alert" className="text-red-200">Access records could not be refreshed. Verify before assuming access was revoked.</p>}
    </div>}
  </section>;
}
