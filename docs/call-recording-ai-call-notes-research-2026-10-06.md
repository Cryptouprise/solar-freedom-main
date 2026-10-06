# Call Recording + AI Call Notes: Research and Recommendation

**Date:** 2026-10-06
**For:** Chase (Solar Freedom)
**Goal:** Every call you are on (regular cell calls *and* WhatsApp calls) gets recorded, transcribed, summarized, and turned into a report that goes out with one click or no click, the way a Zoom/Granola meeting does.

---

## 1. The straight answer

**No single Android app can do this.** Google deliberately locked it down. "Record every call, both sides, automatically, including WhatsApp" is only possible on Android through one of three architectures:

| Architecture | What it covers | What it misses | Effort |
|---|---|---|---|
| **A. Hardware recorder on the phone** (Plaud Note Pro) | Any call from any app: cell, WhatsApp, Zoom, Teams. Auto-detects calls. Both sides. Any Android. | Only works when the audio comes out of the phone itself (earpiece or speakerphone), not earbuds. One more thing to charge. | Buy it, stick it on the phone, done. |
| **B. The phone's own dialer** (Pixel Call Notes, Samsung Call Transcript) | Regular cellular calls. Free, polished, on-device AI summary, legally announces recording. | WhatsApp and every other VoIP app. Samsung is manual per call. Only Pixel 10 can auto-run on *every* call. | Settings toggle. |
| **C. Business phone system** (GoHighLevel LC Phone, which you already have; or Quo, Dialpad, Zoom Phone) | Every call on that business number: auto-record, transcript, AI summary, auto-post to CRM, workflow fires the report. This is the real "treat it like a Zoom call." | Calls on your personal cell number and personal WhatsApp. | Config in GHL + one workflow. |

**My recommendation is a stack, not a product:**

1. **Plaud Note Pro** on your phone for universal capture (cell + WhatsApp + anything). ~$189 one-time + $99.99/yr Pro plan.
2. **GoHighLevel LC Phone** for business calls: turn on recording + transcription ($0.024/min) + the "Transcript Generated" workflow trigger so the report writes itself and lands on the contact, in your inbox, and optionally as a text to the prospect.
3. **One report template** used everywhere (Plaud template, GHL AI Agent prompt, and later your own Solar Freedom pipeline), so every call produces the same "deal report" no matter where it was recorded.

Details, prices, and the holes in each option are below.

---

## 2. What dealclose.cc probably is

I could not find it. The domain does not resolve from here (DNS lookup fails from two independent networks), and there is zero footprint in web, developer, or app-store indexes for "dealclose.cc" or "DealClose" as a call-recording product. That points to one of three things:

- Your buddy built it himself (you suspected this) and it's a private tool, or
- The domain is slightly different than you heard (dealclose.co, dealcloser, closedeal, etc.), or
- It's a white-labeled wrapper around something below (CallRecap, Plaud, or a GHL/Twilio pipeline).

**What it almost certainly is under the hood:** recording source → speech-to-text (Whisper/Deepgram) → an LLM prompt with a fixed "deal report" template → formatted email/PDF/SMS → CRM note. That is a weekend build on top of what Solar Freedom already has (see Section 8). **Ask him for a screenshot or the exact link** and I'll match it feature for feature.

---

## 3. Why Android makes this hard (read this once, it explains every limitation below)

- **Android 9 (2018)** removed the audio source third-party apps used to capture the other side of a call. **Google Play policy (May 2022)** then banned apps from using the Accessibility API as a workaround. Result: only the phone's *built-in dialer* (Google Phone, Samsung Phone) can legitimately record cell calls, and it's gated by region and carrier.
- **WhatsApp and other VoIP apps** run their own audio path. Third-party recorders (Cube ACR, ACR Phone, CallRecap) hook Android's ConnectionService and need a sideloaded "Helper" app. ACR Phone's developer states plainly: *"Call recording might be one sided on phones that do not have a Qualcomm chipset."* Pixels (Tensor chips) and Exynos Samsungs are the problem devices. The Galaxy S25, S25+ and S25 Ultra are Snapdragon, so they are the most likely to work.
- **Bluetooth earbuds** route call audio past the part of the system apps can read, so recordings become one-sided. **Speakerphone** is the universal fix for apps, and the only way the Plaud vibration sensor or a mic-based tool (Granola mobile) can hear both sides.

So any software-only Android recorder is "works on this phone, not on that one." Hardware (Plaud) and business phone systems (GHL/Quo/Zoom) sidestep the whole fight.

---

## 4. Every option, by category

### A. Built into the phone (free)

**Google Pixel 9 / 10: Call Notes** (the best native option)
- On-device Gemini Nano transcribes the call and writes a summary with topics, dates/times/places, and next steps. Pixel 10 also suggests calendar events, tasks and reminders you can create with one tap.
- **Pixel 10 can run Call Notes automatically on every call** (with a 3-second timer option). Pixel 9 can auto-run for selected numbers or all non-contacts.
- Announces to the other party when it starts. Recording, transcript and summary stay on the device; you can copy/share the summary and share the .wav recording.
- US English. Requires a US SIM. Not on Pixel "a" models. **Does not touch WhatsApp calls.**

**Google Pixel 6+: Call Recording** (no AI)
- Rolled out widely Nov 2025. Manual button, or auto-record non-contacts / a list of numbers. Plays an announcement. Audio only, stored locally; you'd transcribe elsewhere.
- Google says the Phone app's recording also appears on other brands with Android 9+ where region/carrier allows. Treat as "check your phone."

**Samsung Galaxy S24 / S25 (One UI 7+): Call recording + Transcript Assist**
- First time Samsung has offered call recording on US phones. Records, transcribes, summarizes, translates. Needs Samsung account + internet for the AI parts.
- **Manual: you tap record on each call.** Plays an announcement to both parties. No "record all calls" on US firmware per Samsung's US support page. Summaries not available on A-series. Not for WhatsApp.

**iPhone (for completeness):** iOS 18.1+ records and transcribes cellular calls natively with an announcement. Same WhatsApp gap.

### B. Third-party Android recorder apps

| App | What it records | Auto? | AI report | Price | Catch |
|---|---|---|---|---|---|
| **CallRecap** (callrecap.app) | Cell calls via native dialer integration; WhatsApp/Telegram/VoIP via "CallRecap Connect" helper | Yes | Yes: key points, commitments, action items with dates, follow-ups; export PDF/DOC/CSV/TXT or email; Max tier adds objection detection, buying signals, coaching | Free 120 min first month; Pro $14.99/mo (600 min); Max $29.99/mo (1,800 min) | Newest player, no public reviews yet. Device-dependent for VoIP like everyone else. Closest off-the-shelf match to "dealclose." |
| **Cube ACR** | Cell + WhatsApp, Telegram, Signal, Viber, etc. | Yes | Basic; cloud backup to Google Drive/email | Free + Premium (price only shown in-app) | Needs sideloaded **Cube ACR Helper** on Android 9+; Android 13+ needs "Allow restricted settings." VoIP recording "if your device allows it." One-sided risk on Tensor/Exynos. |
| **ACR Phone** (NLL Apps) | Cell + VoIP apps using ConnectionService (WhatsApp confirmed) | Yes | No | Free/Pro | Most honest dev: one-sided on non-Qualcomm phones. Needs ACR Phone Helper. |
| **Truecaller Premium** | Cell calls, both sides, with beep | Manual/floating button | Transcript + summary (LLM) | ~$3.99/mo or $29.99/yr (last published) | Not WhatsApp. Also a huge spam-ID app you may not want as your dialer. |
| **Salestrail** | SIM/GSM + WhatsApp + WhatsApp Business, **Android only** | Yes, background | No AI summary; call analytics + cloud storage | ~$10.50/user/mo (or $8 base + $3 recording + $7 CRM) | Built for sales teams: pushes every call to HubSpot/Salesforce/API/webhooks. Good capture layer for a team; you'd add the AI layer yourself. |
| **TapeACall** | Cell calls via 3-way merge to their recording line | Manual per call | Transcription add-on | ~$9.99 | Clunky merge dance every call. Not WhatsApp. |

**Fireflies, Otter, tl;dv, Fathom:** meeting bots. They cannot record carrier or WhatsApp calls on Android (Otter's own support says so). Their mobile apps record the room through the mic, so speakerphone only.

### C. Hardware that records any call from any app

**Plaud Note Pro** ($189 list, $150.99 on sale) — **the single most complete answer for "every call, including WhatsApp, on any Android."**
- Credit-card-sized, magnets to the back of the phone. A vibration-conduction sensor reads the phone's speaker directly, so it captures both sides of *any* call from *any* app (Plaud confirms WhatsApp, Zoom, Teams) on any Android, no OS permission involved.
- **Pro auto-detects a phone call and switches modes by itself**; the cheaper Plaud Note ($159) needs a manual switch each time. NotePin wearables do **not** do phone calls.
- 4 mics, 16 ft pickup for in-person/truck/kitchen-table conversations, ~50 hr battery, AMOLED status display.
- App: auto-transcribe + summarize ("AutoFlow"), role/industry templates, mind maps, shared workspace on mobile/desktop/web. Plans: Starter free (300 min/mo), **Pro $99.99/yr (1,200 min/mo)**, Unlimited $239.99/yr.
- **Catch:** audio must come out of the phone (hold it to your ear or speakerphone). Earbuds/Bluetooth defeat it. It does not announce recording; you must. 1,200 min/mo is ~40 min/day of calls; heavy months need Unlimited.

**RecorderGear PR200** (~$109) — Bluetooth recorder that pairs as a headset and records both sides of GSM and VoIP (WhatsApp) calls to 8 GB. No AI; you'd drop files into Plaud/Granola/your own pipeline. Old-school but bulletproof.

**Magmo Pro** — MagSafe call recorder, iPhone-first; Android only via magnetic case. Skip.

### D. Business phone systems: the real "treat it like a Zoom call" path

Everything here records *automatically*, transcribes, writes an AI summary, and can post it to CRM and fire a workflow. The trade: calls must go through that number/app (VoIP), not your carrier line.

**GoHighLevel LC Phone (you already have GHL wired into Solar Freedom)**
- Call recording is standard on LC Phone. **Call transcription: $0.024 per recorded minute**, toggle at Settings → Phone System → Voice → Call Transcription. Applies to inbound and outbound.
- **"Transcript Generated" workflow trigger** fires the moment a transcript exists, passing full transcript, duration, direction, contact, timestamps. Chain the **AI Agent workflow action** (your report prompt) → add note to contact → email you → SMS/email the prospect. That is the dealclose button, with zero clicks.
- Calls placed from the LeadConnector mobile app *through your LC number* are recorded. **Calls placed via "SIM-based calling" are not recorded or logged** (HighLevel is explicit). Once an LC number is active for the sub-account, the app uses LC Phone.
- Ready-made n8n templates exist if you'd rather run the AI step outside GHL: "Transcribe and Summarize GoHighLevel Call Recordings" (n8n #10255) and "Summarize sales calls into GoHighLevel notes with Deepgram, Gemini and Sheets" (n8n #16337). (Your n8n MCP server failed to connect in this session, so I couldn't inspect your instance.)

**Quo (formerly OpenPhone)** — Starter $15/user/mo annual ($19 monthly) is manual recording only. **Business $23 annual ($33 monthly): auto call recording + AI summaries + transcripts on every call + HubSpot/Salesforce.** Scale $35/$47. Android app, VoIP numbers on top of your phone.

**Dialpad Connect** — Standard $15/user/mo annual ($27 monthly) includes call recording and AI transcription/recaps; Pro $25/$35. Real-time transcript on screen.

**Zoom Phone** — from $10/user/mo metered, ~$15 unlimited. Admin can enable **Automatic Call Recording** for the whole account, and **"Call summary with AI"** can be set to automatic; summaries show in the Zoom app, web portal, and email. Transcripts searchable. If you want it literally "like a Zoom call," this is that.

**Google Voice** — standalone Starter $10 / Standard $20 plans now exist and "Take notes for me" (Gemini notes) is being pushed, but **automatic call recording is only on Premier ($30)** and Voice historically records inbound only. Not a fit.

### E. WhatsApp calls specifically (the hard part)

1. **Plaud Note Pro** — the only "set it and forget it" answer. Phone to ear or speaker.
2. **Business phone systems do not help** unless the WhatsApp call goes through the **WhatsApp Business Calling API** (available to all businesses via BSPs since July 15, 2025). The API records opt-in per call with a mandatory spoken disclosure and purpose, delivers the file by webhook (7-day retention), and added transcription June 30, 2026. **Wati** turns this into toggles: Auto Record All Calls, Auto Transcripts, Auto Summaries; first 1,000 recording min/mo free then $0.01/min; Pro $119/mo annual ($149 monthly), Business $279/$349. Twilio offers the same over Programmable Voice. **Catch:** only calls to/from your *business* WhatsApp number via the API, not your personal WhatsApp on your phone; Meta business verification and a messaging-limit tier of 2,000 conversations/day are prerequisites.
3. **Android screen recorder with "media sounds + mic"** — works on many phones on speakerphone. Manual, clunky, you'll forget.
4. **CallRecap / Cube ACR / ACR Phone with Helper** — works on some phones (Snapdragon best), one-sided on others. Test before trusting.
5. **Salestrail** — Android background recorder specifically covering WhatsApp + WhatsApp Business, ~$10.50/user/mo, pushes to CRM.
6. **Take WhatsApp calls on your laptop** — WhatsApp Desktop supports voice calls; **Granola (Mac/Windows) captures system audio from any app** without a bot, so a WhatsApp Desktop call gets Granola notes exactly like a Zoom call. Also true for Zoom Phone / Quo desktop calls.

### F. The AI "report" layer (what turns a recording into the badass report)

- **Granola** — free (30-day history), Business $14/user/mo (unlimited history, HubSpot/Zapier/Slack, follow-up emails, MCP/API), Enterprise $35. Now on Mac, Windows, iOS, **Android**, Apple Watch. Mobile "phone call" mode listens through the mic, so speakerphone. Best-in-class templates and "enhance notes." It is a notepad, not a call recorder; it will not capture a carrier call in your ear.
- **Plaud AI** — templates by role, AutoFlow summaries, shareable links, mind maps. Decent, improving fast; locked to Plaud recordings.
- **CallRecap** — report built in, exports PDF/DOC, email send, Drive/Dropbox backup.
- **GHL AI Agent action / Conversation AI summaries** — your report prompt runs inside the CRM and lands on the contact.
- **Build your own** (Section 8) — one template, every source.

---

## 5. Comparison matrix

| Option | Cell calls | WhatsApp | Zero-tap auto | Both sides reliable | AI summary | Report sent automatically | Cost |
|---|---|---|---|---|---|---|---|
| Pixel 10 Call Notes | Yes | No | **Yes (every call)** | Yes | Yes (on-device) | No (share manually) | Free w/ phone |
| Pixel 9 Call Notes | Yes | No | Partial (lists/non-contacts) | Yes | Yes | No | Free |
| Samsung S24/S25 Call Transcript | Yes | No | No (tap each call) | Yes | Yes | No | Free |
| **Plaud Note Pro** | **Yes** | **Yes** | **Yes** | **Yes** (phone/speaker audio) | Yes | Share link / export; Zapier-style automation limited | $189 + $99.99/yr |
| CallRecap | Yes | Device-dependent | Yes | Device-dependent | Yes, sales-oriented | Email/PDF export | $14.99–29.99/mo |
| Cube ACR / ACR Phone + Helper | Yes | Device-dependent | Yes | One-sided on Tensor/Exynos | Minimal | No | Free–low |
| Salestrail | Yes | Yes (Android) | Yes | Mostly | No | To CRM/webhook (audio + log) | ~$10.50/user/mo |
| **GHL LC Phone + workflow** | LC number only | No | **Yes** | Yes | Yes | **Yes (workflow)** | Recording + $0.024/min |
| Quo Business | App number only | No | Yes | Yes | Yes | CRM + Zapier | $23–33/user/mo |
| Zoom Phone | App number only | No | Yes | Yes | Yes | Email/portal | $10–15/user/mo |
| Wati (WhatsApp API) | No | Business WA number only | Yes | Yes | Yes | Webhooks/CRM | $119+/mo |
| Granola desktop | Only VoIP on laptop | Via WhatsApp Desktop | Auto-detects meetings | Yes | Best templates | Follow-up email drafts | Free / $14 |

---

## 6. Legal (keep this simple and safe)

- **Colorado is one-party consent.** You can record your own calls. Penalty for illegal interception is a class 2 misdemeanor.
- **But you call across state lines.** All-party-consent states: **California, Connecticut (civil), Delaware, Florida, Illinois, Maryland, Massachusetts, Montana, Nevada, New Hampshire, Pennsylvania, Washington.** Ported numbers mean area code ≠ location. The accepted business practice is **notice on every recorded call; continued participation counts as consent.**
- The native tools (Pixel, Samsung, Truecaller, GHL/Quo/Zoom, the WhatsApp API) **announce automatically**. **Plaud, Cube, ACR, Salestrail, screen recording do not.** So your script, every call: *"Quick heads-up, I record my calls so I can send you accurate notes afterward, that cool?"* It also sells: you're the guy who sends the notes.
- Solar-contract disputes can end up in front of attorneys. Recordings are discoverable, which is usually good for you, but store them deliberately (one place, retention policy, access control).

---

## 7. Recommendation, with a decision tree by phone

**Step 1: capture everything.** Buy a **Plaud Note Pro**. It's the only option that covers cell + WhatsApp + in-person on any Android with no per-call effort. Put it on Pro ($99.99/yr).

**Step 2: make the business line do the work.** In GHL: turn on call recording and transcription; build one workflow on "Transcript Generated" → AI Agent (report prompt) → Note on contact → email to you (+ optional SMS/email to the prospect). Route all business calls through your LC number in the LeadConnector app (not SIM-based calling). Now every business call produces the report by itself.

**Step 3 (phone-specific free layer):**
- **Pixel 10:** turn on automatic Call Notes for every call. You now have a second, free, announced recording of every cell call.
- **Pixel 9:** add your contacts list to auto Call Notes and enable for non-contacts.
- **Galaxy S24/S25:** tap record at the start of each cell call (announces for you). Snapdragon S25 is also the best phone for CallRecap/Cube WhatsApp recording if you want a software backup to Plaud.
- **Anything else:** CallRecap ($14.99/mo) as the software layer; test WhatsApp on day one and don't trust it until you've heard both sides.

**Step 4: one report template everywhere.** Same fields in Plaud's template, GHL's AI Agent prompt, and (later) your own pipeline so the report looks identical regardless of where the call was captured.

**If you want it to feel exactly like Zoom:** add Zoom Phone or Quo Business for the business line instead of (or alongside) LC Phone. GHL wins only because you already pay for it and it's where your contacts live.

---

## 8. The "one-click report": replicate dealclose, including the DIY option

### 8a. The report template (use this everywhere)

```
DEAL REPORT — {contact} — {date} — {channel: cell/WhatsApp/LC Phone} — {duration}
1. Who they are: name, address/state, installer, loan/lease/PPA, monthly payment, system age
2. Their situation in one paragraph (their words)
3. Pain + urgency (1–5) and why
4. What they want (cancel, refinance, sue, remove panels, sell house)
5. Objections / fears raised, and how I answered
6. Commitments: what I promised, what they promised, with dates
7. Next step + exact date/time, who owns it
8. Red flags (two-party state? deadline? already in collections? attorney involved?)
9. Follow-up email draft to them (3–5 sentences, their words, one CTA)
10. Internal note for the attorney partner (if applicable)
```

### 8b. Zero-code version (this week)
GHL workflow: Transcript Generated → AI Agent action with the template → Add Note → Send Email (to you) → optional Send SMS/Email (to contact). Plaud: paste the same template as a custom summary template; share link or export after each call.

### 8c. Solar Freedom version (the asset you own)
You already have the parts in this repo:
- `server/_core/voiceTranscription.ts`: Whisper-format transcription helper (16 MB limit, segments, language) — currently unused.
- OpenRouter LLM access (`OPENROUTER_API_KEY`), S3 upload/presign, GHL client + webhooks, Express/tRPC.

Pipeline: **source → S3 → transcribe → LLM(template) → deliver.**
- *Sources:* GHL recording URL from the call-completed webhook; Plaud export (manual share, or watch a Google Drive/Dropbox folder); Cube ACR / CallRecap cloud backup folder; Salestrail webhook.
- *Transcribe:* existing Whisper helper, or Deepgram Nova-3 (~$0.0043/min batch, speaker diarization) / AssemblyAI (~$0.15–0.21/hr). A 30-minute call costs under $0.20 to transcribe.
- *LLM:* one prompt = the template above; ~$0.01–0.05 per call on OpenRouter.
- *Deliver:* email to you, GHL contact note via `ghlClient`, optional SMS to prospect, and a `/admin/calls` page with search across all transcripts.
- *UI:* a single "Send report" button on the call row = the dealclose button. Or no button: auto-send when confidence is high and the call is > 2 minutes.

Estimated build: 2–3 focused days for a working v1 if sources are GHL + a watched folder. Worth it only once Steps 1–2 above are live and you're sick of copying reports around.

---

## 9. Holes I'd poke (so you don't find them the hard way)

1. **"Every damn call" is a firehose.** 40+ calls a day → 40 reports nobody reads. Gate it: auto-report only calls > 2 min or with a known contact; everything else gets a one-line log.
2. **Earbuds break the universal option.** If you live in AirPods, Plaud won't hear the other side. Habit change required (phone to ear, or speaker in the truck).
3. **Software recorders are device roulette.** Test WhatsApp recording on your actual phone for a day before relying on any app. Tensor Pixels are the worst case for third-party VoIP capture.
4. **Two recorders on one call** (Plaud + Pixel Call Notes) means duplicate reports. Pick a primary per channel: Plaud for WhatsApp/personal cell, GHL for business line, Pixel/Samsung as free backup.
5. **Consent habit.** Three of your layers don't announce. Script it, say it every time, and store the recordings in one governed place.
6. **Minute caps.** Plaud Pro 1,200 min/mo; CallRecap Pro 600; GHL meters at $0.024/min on top of recording. Heavy months need Plaud Unlimited ($239.99/yr).
7. **Lock-in.** Plaud and CallRecap keep your transcripts in their apps. Export monthly, or build 8c so the transcripts live in your database.
8. **The buddy's tool may be a GHL workflow.** Before buying anything, ask him. If it is, Step 2 above is the same thing and you already pay for it.

---

## 10. Next steps (two weeks)

**Week 1**
- [ ] Get the exact dealclose link/screenshot from your buddy.
- [ ] Order Plaud Note Pro; set the Deal Report template in the Plaud app.
- [ ] GHL: enable call recording + transcription; build the Transcript Generated → AI Agent → Note → Email workflow; confirm the LeadConnector app uses your LC number, not SIM calling.
- [ ] Phone: enable Call Notes (Pixel) or learn the record tap (Samsung). Record a test WhatsApp call with Plaud and with CallRecap; listen for both sides.

**Week 2**
- [ ] Review 10 real reports; tighten the template.
- [ ] Decide: stop there, or green-light the Solar Freedom pipeline (8c) so every transcript lives in your own DB with one "Send report" button.

---

---

## 11. Your one system (added 2026-10-06 after clarification: Android + WhatsApp + Zoom, one place to always know what's going on)

**Decision: Plaud is the hub.** It is the only tool where Android cell calls, WhatsApp calls, Zoom calls (phone or computer), in-person conversations, and any stray audio file all land in one library, get the same report template, and are searchable together. Granola cannot import outside audio and cannot hear a call in your ear, so it cannot be the hub. GHL only sees calls on your business number.

### Three doors, one library

| Door | What it catches | Tool | Setting |
|---|---|---|---|
| **1. Your phone** | Cell calls, WhatsApp calls, Zoom on the phone, in-person (truck, kitchen table) | **Plaud Note Pro** on the back of the phone | Auto-detects calls and switches modes by itself. Rule: phone to ear or speakerphone. **No earbuds.** |
| **2. Your computer** | Zoom, Google Meet, Teams, WhatsApp Desktop calls | **Plaud Desktop** (Windows + Mac, no device required) | Set to **"automatic recording when meetings start."** Syncs to the same workspace. |
| **3. Everything else** | A Zoom cloud recording, a voicemail, a file someone sends you | **Plaud app → Import Audio** (MP3/MP4/WAV, up to 5 hours) | Processed exactly like a device recording. |

### One template, zero effort
- Set the **Deal Report** template (Section 8a) as the default summary template. AutoFlow transcribes and summarizes every recording without you touching it.
- Plan: **Unlimited ($239.99/yr).** "Every damn call" will blow through the Pro plan's 1,200 min/mo (that is 40 min/day).

### How you always know what you're doing (three views)
1. **Ask Plaud** (in the app, across every conversation): "What did I promise this week?" "Where are we with the Hendersons?" "Who did I talk to about Sunrun in September?"
2. **Plaud Agent** (new, uses credits): pulls action items with owners and deadlines, drafts the follow-up email through the **Gmail connector**, drops dates on **Google Calendar**, posts to **Slack/Notion**. Connectors at launch: Slack, Gmail, Google Docs, Google Calendar, Outlook, Notion, Linear, Zapier.
3. **Zapier** (trigger: Plaud transcription completed) does the plumbing:
   - → **GHL inbound webhook → workflow: Add Note on the contact + Add Task for the next step** (so the CRM is always current without you typing).
   - → **Digest by Zapier → one 6 pm email: "Today's calls," each with next step.**
   - Optional → ClickUp task per action item, Slack channel, Google Sheet log.

### The daily rhythm (this is the whole habit)
- **Before every call:** "Quick heads-up, I record my calls so I can send you accurate notes afterward, that cool?" Plaud does **not** announce for you.
- **After the call:** nothing. If it's hot, tap Share (or let the Agent draft the email) and the report goes to them.
- **6 pm:** read the digest, approve the follow-ups the Agent drafted. Ten minutes.
- **Friday:** Ask Plaud "open commitments this week," close the loop.

### Belts and suspenders (free, optional)
- Pixel Call Notes / Samsung Call Transcript on cell calls: announced, on-device, a second copy for free.
- GHL LC Phone recording + transcription for the business line: keeps those calls native in the CRM (Section 4D).
- Zoom's own AI summary stays on as a backup for Zoom meetings.

### Cost (year one)
| Item | Cost |
|---|---|
| Plaud Note Pro | $189 list (~$151 on sale) |
| Plaud Unlimited plan | $239.99/yr |
| Plaud Desktop | included |
| Zapier paid plan | ~$20–30/mo depending on tasks |
| Plaud Agent credits | pay-as-you-go beyond the launch gift |
| Later, if reps join: Plaud Team | $20/user/mo annual (launch), adds shared workspace, admin, Plaud MCP server (beta) |

### Holes in this system (know them now)
1. **Earbuds kill door 1.** The sensor reads the phone speaker. Habit change or it silently records only you.
2. **Nothing announces recording except the free backups.** The consent line is on you, every call, especially into the 12 all-party states.
3. **Plaud Desktop is new.** Expect rough edges; keep Zoom's own summary on until you trust it.
4. **Agent credits are a meter.** Default transcription and summaries are unlimited; Agent actions (drafting emails, taking actions in tools) burn credits.
5. **Lock-in.** Zapier → Google Drive archive of every transcript keeps you portable. Phase 2 below makes it yours outright.

### Phase 2 (only if you want it inside Solar Freedom)
Same Zapier trigger → a Solar Freedom endpoint → `conversations` table → the Deal Report rendered on an `/admin/calls` page with "Today," "Open commitments," and "Send report" buttons. Uses the existing transcription helper, OpenRouter, S3, and GHL client. Two to three focused days. Decide after two weeks on the Plaud system, not before.

### Additional sources for Section 11
- Plaud Desktop: https://www.plaud.ai/pages/plaud-desktop ; coverage: https://mightygadget.com/plaud-desktop-brings-ai-meeting-transcription-to-windows-and-mac-without-meeting-bots/
- Plaud audio import: https://support.plaud.ai/hc/en-us/articles/50609466994713-Audio-import
- Plaud Zapier integration: https://zapier.com/apps/plaud/integrations ; https://zapier.com/blog/automate-plaud
- Plaud Intelligence / Agent connectors: https://www.plaud.ai/blogs/news/get-ready-new-plaud-intelligence-for-team
- Plaud Team pricing: https://www.plaud.ai/pages/plaud-team
- Granola cannot import audio: https://blog.buildbetter.ai/best-granola-alternatives-private-meeting-notes-2026/
- LeadConnector on Zapier: https://help.zapier.com/hc/en-us/articles/8496037147789-How-to-Get-Started-with-LeadConnector-on-Zapier

## Sources

- Pixel Call Notes help: https://support.google.com/phoneapp/answer/15257579
- Pixel 10 calling features (auto Call Notes for every call): https://blog.google/products-and-platforms/devices/pixel/calling-updates-pixel-10/
- Pixel call recording rollout: https://9to5google.com/2025/11/13/pixel-phone-call-recording/
- Samsung US call recording + Transcript Assist: https://www.samsung.com/us/support/answer/ANS10004613/
- Samsung call recording comes to US with One UI 7: https://9to5google.com/2024/12/10/samsung-galaxy-call-recording-one-ui-7-update/
- Google Play 2022 accessibility policy: https://www.theregister.com/2022/04/22/google_banning_thirdparty_callrecording_apps/
- Cube ACR Helper: https://cubeacr.app/helper.html ; FAQ: https://cubeacr.app/faq.html
- ACR Phone VoIP recording limits: https://nllapps.com/apps/cb/voip-call-recording.htm
- CallRecap: https://callrecap.app/ ; Capterra listing: https://www.capterra.com/p/10046323/CallRecap/
- Truecaller US/Canada call recording: https://techcrunch.com/2023/06/14/truecaller-reintroduces-call-recording-for-premium-users
- Salestrail call recording: https://www.salestrail.io/call-recording ; pricing: https://www.capterra.com/p/182030/Salestrail/
- Otter on phone calls: https://withallo.com/blog/how-to-record-phone-calls-with-otter-ai
- Plaud Note Pro: https://www.plaud.ai/products/plaud-note-pro ; Pro vs Note: https://www.plaud.ai/blogs/news/plaud-note-pro-vs-plaud-note-explained ; WhatsApp calls: https://support.plaud.ai/hc/en-us/articles/50836949250073-Can-the-Plaud-Note-record-WhatsApp-calls ; plans: https://www.plaud.ai/
- Plaud Note Pro review (auto call detection, pricing): https://laxis.com/blog/plaud-note-pro/
- RecorderGear PR200: https://www.walmart.com/ip/196767085
- Granola phone-call notes: https://granola.ai/blog/introducing-notes-on-phone-calls ; platforms: https://www.granola.ai/ ; pricing: https://www.granola.ai/pricing
- Quo (OpenPhone) pricing: https://www.quo.com/pricing
- Dialpad pricing: https://www.ringly.io/blog/dialpad-pricing
- Zoom Phone call summary with AI: https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0074867
- Google Voice standalone plans + Take notes for me: https://workspace.google.com/blog/product-announcements/google-voice-offers-ai-note-taking-and-new-subscriptions-to-help-scale-your-business
- HighLevel call transcription ($0.024/min): https://help.gohighlevel.com/support/solutions/articles/155000002841-how-to-enable-call-transcriptions-for-recorded-calls
- HighLevel Transcript Generated trigger: https://help.gohighlevel.com/support/solutions/articles/155000006632-workflow-trigger-transcript-generated
- HighLevel SIM-based calling (not recorded): https://help.gohighlevel.com/support/solutions/articles/155000005814-sim-based-calling-with-the-mobile-app
- HighLevel LC Phone pricing: https://help.gohighlevel.com/support/solutions/articles/48001223556-phone-system-pricing-billing-guide
- n8n GHL call summary templates: https://n8n.io/workflows/10255-transcribe-and-summarize-gohighlevel-call-recordings/ ; https://n8n.io/workflows/16337-summarize-sales-calls-into-gohighlevel-notes-with-deepgram-gemini-and-sheets/
- WhatsApp Business Calling API recording: https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/call-recording/ ; transcription: https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/call-transcription/
- Twilio WhatsApp Business Calling: https://www.twilio.com/en-us/blog/drive-more-sales--engagement-and-better-support--introducing-wha
- Wati WhatsApp call recording/transcripts/summaries: https://support.wati.io/en/articles/14472037-how-to-enable-whatsapp-call-recording-transcription-and-summaries-in-wati ; pricing: https://setsmart.io/blog/wati-pricing
- Call recording consent laws by state (2026): https://viirtue.com/call-recording-consent-laws-by-state-2026-guide/ ; Colorado: https://www.shouselaw.com/co/blog/colorado-recording-law/
- Deepgram pricing: https://diyai.io/ai-tools/speech-to-text/deepgram-pricing-2026/ ; AssemblyAI pricing: https://www.costbench.com/software/ai-transcription-apis/assemblyai/
- Bluetooth/headset recording limits explained: https://www.umevo.ai/blogs/ume-all-posts/how-to-record-phone-calls-on-android-with-a-wireless-headset-technical-limits-and-working-solutions
