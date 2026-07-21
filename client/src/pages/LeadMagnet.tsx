import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Download, FileText, Shield, Clock, Star } from 'lucide-react';

const PDF_URL = '/manus-storage/solar-cancellation-letter-template_79f23296.pdf';

export default function LeadMagnet() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) {
      setError('Please enter your name and email.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      // Submit to GHL webhook (same as main form)
      await fetch(
        'https://services.leadconnectorhq.com/hooks/WBEbDUNxKL5GyxIUjjdZ/webhook-trigger/ef73980f-0111-46a0-8bb9-1cbed104028b',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: firstName,
            email,
            source: 'breakyoursolarcontract.com',
            form_name: 'Cancellation Letter Lead Magnet',
            'contact.first_name': firstName,
            lead_type: 'lead_magnet_download',
          }),
        }
      );
    } catch (_) {
      // Fail silently — still show download
    }

    setSubmitting(false);
    setStep('success');

    // Auto-trigger download
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = PDF_URL;
      link.download = 'Solar-Contract-Cancellation-Letter-Template.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0D0F14] text-[#F8FAFC]">
      {/* Header */}
      <header className="border-b border-white/10 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 text-amber-400 font-bold text-lg hover:text-amber-300 transition-colors">
            ← Solar Freedom
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left: Copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-full px-4 py-1.5 text-amber-400 text-sm font-medium mb-6">
              <Download className="w-4 h-4" />
              Free Download — No Spam
            </div>

            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}>
              SOLAR CONTRACT<br />
              <span className="text-amber-400">CANCELLATION</span><br />
              LETTER TEMPLATE
            </h1>

            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              3 attorney-drafted letter templates for every situation — FTC cooling-off cancellation, pre-installation cancellation, and post-installation rescission demand. Fill in the blanks and send.
            </p>

            {/* What's inside */}
            <div className="space-y-3 mb-8">
              {[
                'FTC Cooling-Off Rule cancellation letter (3-day window)',
                'Pre-installation cancellation letter (outside cooling-off)',
                'Post-installation rescission demand (misrepresentation grounds)',
                'Step-by-step instructions for each letter type',
                'Certified mail and email sending checklist',
                'What documents to gather before sending',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div className="text-center">
                <FileText className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                <div className="text-white font-bold text-sm">3 Templates</div>
                <div className="text-gray-500 text-xs">All situations</div>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                <div className="text-white font-bold text-sm">Attorney-Drafted</div>
                <div className="text-gray-500 text-xs">Legal language</div>
              </div>
              <div className="text-center">
                <Clock className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                <div className="text-white font-bold text-sm">Instant PDF</div>
                <div className="text-gray-500 text-xs">Download now</div>
              </div>
            </div>
          </div>

          {/* Right: Form / Success */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            {step === 'form' ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-gray-400 text-sm ml-1">Used by 2,400+ homeowners</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Get Your Free Templates</h2>
                <p className="text-gray-400 text-sm mb-6">Enter your name and email to download instantly. No spam — ever.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="firstName" className="text-gray-300 text-sm font-medium mb-1.5 block">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="bg-white/5 border-white/20 text-white placeholder-gray-600 focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-300 text-sm font-medium mb-1.5 block">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="bg-white/5 border-white/20 text-white placeholder-gray-600 focus:border-amber-500"
                      required
                    />
                  </div>

                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 text-base rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {submitting ? 'Preparing Download...' : 'Download Free Templates →'}
                  </Button>

                  <p className="text-gray-500 text-xs text-center leading-relaxed">
                    By downloading, you agree to receive occasional emails about solar contract rights. Unsubscribe anytime. We never sell your information.
                  </p>
                </form>

                {/* Bonus CTA */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-gray-400 text-sm text-center mb-3">
                    Need more than a template?
                  </p>
                  <a
                    href="/#contact"
                    className="block w-full text-center py-3 border border-amber-500/50 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/10 transition-colors"
                  >
                    Get a Free Attorney Case Review →
                  </a>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Your Download Is Ready!</h3>
                <p className="text-gray-300 mb-6">
                  Your PDF should be downloading now. If it didn't start automatically, click below.
                </p>
                <a
                  href={PDF_URL}
                  download="Solar-Contract-Cancellation-Letter-Template.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  <Download className="w-5 h-5" />
                  Download PDF Now
                </a>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-gray-400 text-sm mb-4">
                    While you have the templates — find out if you have grounds for full cancellation:
                  </p>
                  <a
                    href="/#contact"
                    className="block w-full text-center py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Get a Free Case Review →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom social proof */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <p className="text-center text-gray-500 text-sm mb-6">
            These templates have helped homeowners with Sunrun, SunPower, GoodLeap, Freedom Forever, Sunnova, and more.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-gray-600 text-sm">
            {['Sunrun', 'SunPower', 'GoodLeap', 'Freedom Forever', 'Sunnova', 'Vivint Solar', 'Tesla Solar', 'ADT Solar'].map((co) => (
              <span key={co}>{co}</span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
