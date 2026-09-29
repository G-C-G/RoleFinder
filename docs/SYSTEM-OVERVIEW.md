# GCG Game Plan: system overview

*For Gold Coast Games (GCG). One web page, `gcg-game-plan.html`. Written so another person or AI can review it without seeing the code.*

## 1. What it is

GCG's team operating system. People onboard by playing a six-minute game ("Find where you fit") that produces a **player card**. From then on, each person has a **Home** that answers three questions within seconds:

1. What is GCG doing right now?
2. Where do I fit?
3. What do you need from me?

Hinda (founder, creative director) plans **events from templates**. The system breaks each event into tasks, **suggests the best person for each and explains why**, and shows every event as a **journey**: Plan → Prep → Check → Play → Report. People take tasks, tick them done, and every contribution leaves a **visible trail**, recorded for fair credit when GCG earns.

**Product rule:** the system does the thinking; the person does the doing. If a feature does not save a team member time, improve their understanding, or make their contribution visible, it does not belong in this version.

## 2. Why it is necessary

- GCG is small, early and mostly unpaid. Without a system, work lives in WhatsApp and in Hinda's head.
- Every event repeats the same 30 to 40 tasks. Rebuilding the plan each time wastes effort and things get missed.
- People need to feel seen and matched fairly, and able to say no.
- Contributions need to be on record for fair credit later.

## 3. Company context

- **GCG runs events.** **Global Games Network (GGN)**, the parent company, designs games and licenses them to GCG. GCG does no game design; an event goes in once its game exists.
- **Flagship nights** (GCG's own nights around a field or profession) and **corporate** work (a welcome game or a full three-round GCG game at a client's event).
- Every event has a **quality check** of the game (about two weeks before) and a **game check day**: a full run-through with the whole crew (about one week before).

## 4. Two worlds

| Team member: MY world | Hinda: GCG's world |
|---|---|
| **Home**: next move (one button), GCG right now (event journey + your part), your place (type, strengths, tasks and events done), next crew date, up for grabs | **Today**: active events, what needs attention, answers waiting, coverage gaps; **Needs you** (max five, one action each); her own next move; every event's journey |
| **Events**: only their events → event page: goal, crew chat link, journey, your part (task cards), crew contributions, run sheet | **Events**: create from a template → event page: goal, journey, needs attention, suggest people, send offers; everything else folded (all tasks, add a task, guests and messages, debrief, more actions) |
| **Me**: player card (shareable), finish your profile, title, likes and dislikes, **GCG trail**, about me and CV strengths folded | **Team**: People (cards, pings, paste-in), **Coverage** (wings as tiles with a dot per person; red means no one or only one), Titles |
| | **Insights**: how fast things get done, on-time rates, where plans are unrealistic |

Team members never see Team, Coverage, Titles, Insights or anyone else's profile.

## 5. Key behaviours

- **Onboarding** is about six minutes: warm-up → seven situations (most / least like me) → six job cards → player card → save. Progress is saved; returning shows "You're 40% through… pick up where you left off". The rest of the profile (what you have done, what you bring, proudest work, how you work, why you are here) is asked later as "Finish your profile: N quick questions".
- **Task cards** read in two seconds: deadline first, task, event, why you, "🔒 Needed for: [checkpoint]" on Must tasks, one big button (Take it / Done), quieter secondary options (Can't do it, Not really me; plan date, calendar, stuck, extra hand and crew chat under More).
- **Declining never hides a task.** "Can't do it" sends it straight back to the pool: it appears in Hinda's Needs you and in Up for grabs. Optional reason: not available / not my thing / need help.
- **"Not really me"** updates the person's card so fewer tasks like it come their way. The system listens rather than labels people permanently.
- **All clear**: when nothing needs you, Home says so and shows how the event is going and what you have done for it.
- **Recognition without ranking**: crew contributions per event and each person's GCG trail list names and work, never leaderboards or points.
- **Communication stays in WhatsApp**: the event's crew chat link is on the event page and inside tasks. No chat is built in.
- **Priorities**: 🔴 Must (about a third), 🟡 Should, ⚪ Nice. Colour always comes with text.

## 6. Privacy

Profiles are private: each person sees only their own; Hinda sees everyone's. People can share their own card as a PDF. Shared with the team: names, event tasks and their status, who finished what, titles. Hinda only: everyone's cards, motivations, card corrections, per-person timing data.

## 7. Technology and cost

- Now: one HTML file published on Claude, using Claude's sign-in and shared data. Cost $0; teammates need a free Claude account.
- Next (after a pilot): GitHub Pages plus Firebase free tier with name-and-password login and phone notifications, roughly $0 to $5 a month plus a domain.

## 8. Deliberately not in this version

Availability or capacity tracking, a chat system, complex calendars, points, badges or leaderboards, a social feed, heavy analytics. Revisit availability after real use shows whether declines cluster around overload.

## 9. Not yet proven

Nobody has used it for a real event yet; everything is tested with sample data. Templates can only be changed in code. Pings show when the page is opened (no push notifications yet). Timestamps record when people tap, not always when the work happened.

## 10. Screens

`docs/screens/` and `docs/GCG-Game-Plan-screens.pdf` (phone width, sample data with made-up names and a sample event).
