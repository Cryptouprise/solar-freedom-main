import { getServiceGuidance, SERVICE_REVIEW_DISCLOSURE, type ServiceIntent } from "@shared/serviceGuidance";

export default function ServiceReviewGuidance({ intent, companyName }: { intent: ServiceIntent; companyName?: string }) {
  const guidance = getServiceGuidance(intent, companyName);
  return (
    <section className="py-16 border-y border-white/10" aria-labelledby="service-review-heading">
      <div className="max-w-7xl mx-auto px-6">
        <h2 id="service-review-heading" className="text-3xl font-bold text-white mb-4">{guidance.heading}</h2>
        <p className="text-slate-300 leading-relaxed mb-8">{guidance.introduction}</p>
        <div className="grid md:grid-cols-2 gap-8 text-slate-300 leading-relaxed">
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Who this review is for</h3>
            <p>{guidance.eligibility}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Records to gather</h3>
            <ul className="list-disc pl-5 space-y-2">{guidance.records.map(record => <li key={record}>{record}</li>)}</ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Free initial review versus possible costs</h3>
            <p>{guidance.fees}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Important limits</h3>
            <p>{guidance.limitations}</p>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-white mt-8 mb-3">Practical next steps</h3>
        <ol className="list-decimal pl-5 space-y-2 text-slate-300 leading-relaxed">{guidance.nextSteps.map(step => <li key={step}>{step}</li>)}</ol>
        <p className="mt-8 text-sm text-slate-300 leading-relaxed">{SERVICE_REVIEW_DISCLOSURE}</p>
        <nav aria-label="Related review guidance" className="mt-6">
          <ul className="space-y-2">{guidance.links.map(link => (
            <li key={link.href}><a href={link.href} className="text-amber-400 hover:text-amber-300 underline underline-offset-4">{link.label}</a></li>
          ))}</ul>
        </nav>
      </div>
    </section>
  );
}
