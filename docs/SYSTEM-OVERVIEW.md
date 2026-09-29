# GCG Role Finder: system overview

*For Gold Coast Games (GCG). One web page, `gcg-role-finder.html`. Written so another person or AI can review it without seeing the code.*

## 1. What it is, in one paragraph

A single web page that works as GCG's team operating system. New people **onboard by playing a short game** (about 10–15 minutes) that produces a **player card**: their natural strengths, what they have done, how they like to work, and which GCG jobs suit them. Hinda (founder, creative director) sees everyone's cards, gives people **titles**, and plans **events** from templates. The page breaks each event into tasks with deadlines, **suggests the best person for each task** from their card, and people say yes or no, plan their own dates, add tasks to their calendars, tick them done and say how it went. Everyone sees a **progress timeline** for each event and who did what. Over time it builds a **history of every contribution**, which GCG needs for fair credit once money comes in.

## 2. Why it is necessary

- **GCG is small, early and mostly unpaid.** Many people hold several jobs at once. Without a system, work lives in WhatsApp and in Hinda's head.
- **Every event repeats the same ~30–40 tasks.** Rebuilding the plan each time wastes effort and things get missed.
- **People need to feel seen.** The onboarding gives each person a card that describes them fairly, with CV-ready strengths, and lets them say what they would rather not do.
- **The right person for each task.** Matching uses what people said yes to, what they have done, what they bring, their title and their GCG track record, not just who replies first on WhatsApp.
- **Credit and fairness later.** Every finished task is timestamped and sized, so when GCG earns, contributions are on record, not remembered.
- **Learning.** Timings show where plans are unrealistic, so each event runs better than the last.

## 3. Company context the page is built on

- **GCG runs events.** **Global Games Network (GGN)**, the parent company, designs games and licenses them to GCG. GCG does no game design. An event goes into the system once its game exists.
- **Two lines of work:**
  1. **Flagship nights**: GCG's own game nights, each built around a field or profession, typically 6:30–9:30 PM.
  2. **Corporate**: for event companies and corporations, either a **welcome game** or a **full GCG game (three rounds)**, run at the client's event or conference.
- **Every event has a quality check** of the game (about 2 weeks before) and a **game check day**: a full run of the game with the whole crew (about 1 week before).

## 4. Who uses it and what they see

### Everyone (team members)
| Tab | What it does |
|---|---|
| **My card / Onboarding** | The onboarding game. Five levels: warm-up → 8 situations (pick what is most and least like you) → experience (what you have done, what you bring, proudest work) → jobs that might suit you (yes / maybe / not for me) → about you (how you work best, why you are here). Ends with a **player card**, a "does this sound like you?" check, **strengths for your CV**, and a PDF to download or share. |
| **My profile** | After onboarding: title(s) and what falls under them, live tasks, about me, likes and dislikes, and **what I have done at GCG** (history). Private: only the person and Hinda see it. |
| **My tasks** | A "how this works" guide, **your #1 right now**, each event with its **progress timeline**, whole-crew dates (like the game check day), each task with **why you were picked**, take / pass, **your own plan date**, **add to calendar** (Google or Apple/Outlook), start, done (when, how it went, comment), I am stuck, need an extra hand, a live **run sheet** on the night, and **up for grabs** tasks anyone can claim. |

### Hinda (master view)
| Tab | What it does |
|---|---|
| **Team** | Headline numbers, **🎖 titles** (bundle jobs into a title, give it to people, see best fits), **📣 ping** a person (they see it on opening the page; Hinda sees when it is seen), a **team map** (every person × every wing of the company), everyone's full card, who said yes to each job, draft role owners (next phase), and paste-in for results sent by message. CSV export. |
| **Events** | Create an event from a template and date → every task, checkpoint and deadline appears. Suggest people, send offers, assign directly, ping, copy a link to a task, extra slots, outside helpers. **Priority now** (top 5 at risk), **progress timeline**, **run sheet**, due-soon WhatsApp message, guest message drafts (Luma / WhatsApp / SMS), guest numbers, debrief, **who-is-doing-what PDF**, **event report PDF** with credit per person. |
| **Insights** | How fast things really get done: time to answer offers, time to finish, on-time rates, checkpoint lateness, guest show rates, suggested template changes, per-person view (Hinda only, for support not ranking). CSV export. |

## 5. How an event runs (the core loop)

1. **Create**: pick a template (Flagship night, Corporate welcome game, Corporate full game, Two-day outdoor event) and a date. All tasks and deadlines appear, counted back from the date.
2. **Add what is unique**: place, time, lead, links; add, remove or change tasks.
3. **Staff it**: ✨ Suggest people → adjust → 📣 Send offers (or 📌 assign directly).
4. **People act**: yes or no → plan their date → calendar → tick done with a comment. Stuck or overloaded? One tap.
5. **Hinda steers**: watches Priority now and the next checkpoint, sends the weekly due-soon message, pings, hands passed tasks to the next best person.
6. **After**: guest numbers and debrief → event report PDF → Insights improve the templates.

**Checkpoints** (flagship example): venue, partner and host locked (−21 days) → tickets live and promo out (−14) → game checked and run through (−7) → crew confirmed and tested (−2) → event night → report done (+7). Tasks after an uncleared checkpoint show "waiting on …".

**Priorities**: 🔴 Must (kept to about a third), 🟡 Should, ⚪ Nice. **Sizes**: Small / Medium / Large, used for credit.

## 6. The job map (63 jobs in 10 wings)

Leadership · Strategy (marketing, comms, content, brand, community) · Live event delivery (hosting, door, tech, sound, room, run sheet, scoring, photo, floor manager, food and prizes, guest hosts) · Content work (social, capture, editing, design, invitations, testimonials, guest messages, press) · Sales and partnerships (ticketing, outreach, pricing, corporate sales, client management, venues, sponsorship, community partners) · Operations (project management, logistics, equipment, documentation, data, tools, game review and fit check, outdoor and safety) · Money, legal and compliance · Funding and growth · People and team (scheduling, host training, onboarding, team updates) · Tech and digital.

Each job has a plain description and a "good fit if" line, and is marked Now / Soon / Later.

## 7. Privacy and data

- **Profiles are private.** Each person reads and writes only their own card; only Hinda reads all of them. People can share their own PDF if they choose.
- **Shared with the team:** names, event tasks and their status, who finished what (this is the incentive), titles.
- **Hinda only:** everyone's cards, motivations, card corrections, per-person speed data.
- No email addresses are collected by the page itself.

## 8. Technology and cost

- **Now:** one HTML file published on Claude (claude.ai). Shared data and sign-in come from Claude. Teammates need a free Claude account. Cost: $0.
- **Next (after a pilot):** the same page on GitHub Pages (free) with Firebase (free tier) for data and name-plus-password login; installable on phones with push notifications. Roughly $0–5 a month plus a domain.
- **Later, only if needed:** app-store apps ($99/year Apple, $25 once Google).

## 9. What is honestly not done or not proven

- **Nobody has used it for a real event yet.** Everything is tested with sample data only.
- Templates can only be changed in code, not inside the page (per-event edits work fully).
- No automatic phone notifications yet (pings show when the page is opened; WhatsApp text is generated to paste).
- Task links may not jump to the exact task when opened inside Claude; they will on GitHub Pages.
- **Layout issues seen in the screenshots:** on phones the tab buttons wrap into a stack of pills, and the header title squeezes onto several lines; the admin event page is long (many tasks on one scroll); timestamps record when people tap, not always when work happened.

## 10. Screens

See `docs/screens/` (phone width, sample data with made-up names and a sample event):
01 intro · 02 warm-up · 03 situation · 04 job card · 05 player card · 06 CV strengths · 07 event header · 08 progress timeline · 09 priority now · 10 admin task · 11 team numbers · 12 team map · 13 title · 14 person card · 15 my tasks · 16 task card · 17 whole-crew dates · 18 my profile · 19 insights.
