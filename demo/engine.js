/* Allocation engine for the demo. EXAMPLE DATA ONLY: fictional people, numbers and company.
   It recommends; the manager decides. Weights are a first draft, to be tuned on real records. */
(function (root) {
  "use strict";

  var PEOPLE = {
    ama: { id: "ama", name: "Ama", tag: "The Master", S: 3, A: 9, O: 8, F: 5, week: 20, usual: 36, mult: 1.4,
      done: 41, onTime: 80, rework: 4, range: [74, 86], latest: 71,
      len: { short: 58, medium: 82, long: 91 }, q: { solo: 96, team: 84 }, cons: 88,
      skill: { explain: 45, unclear: 60, urgent: 58, detail: 80, people: 40, steady: 85 } },
    kofi: { id: "kofi", name: "Kofi", tag: "The Storyteller", S: 6, A: 3, O: 6, F: 10, week: 30, mult: 1.0,
      done: 47, onTime: 62, rework: 31, range: [48, 74],
      len: { short: 66, medium: 60, long: 38 }, q: { solo: 61, team: 88 }, cons: 74,
      skill: { explain: 95, unclear: 55, urgent: 62, detail: 45, people: 92, steady: 38 } },
    yaw: { id: "yaw", name: "Yaw", tag: "The Metronome", S: 5, A: 9, O: 10, F: 10, week: 30, mult: 1.1,
      done: 52, onTime: 98, rework: 5, range: [96, 100],
      len: { short: 71, medium: 99, long: 99 }, q: { solo: 95, team: 95 }, cons: 96,
      skill: { explain: 55, unclear: 30, urgent: 71, detail: 97, people: 55, steady: 99 } },
    efua: { id: "efua", name: "Efua", tag: "The Sprinter", S: 10, A: 4, O: 7, F: 8, week: 24, mult: 0.6,
      done: 63, onTime: 72, rework: 29, range: [62, 80],
      len: { short: 94, medium: 70, long: 41 }, q: { solo: 71, team: 71 }, cons: 82,
      skill: { explain: 60, unclear: 45, urgent: 97, detail: 35, people: 72, steady: 41 } },
    selorm: { id: "selorm", name: "Selorm", tag: "The Pathfinder", S: 6, A: 4, O: 7, F: 9, week: 28, mult: 1.0,
      done: 38, onTime: 70, rework: 27, range: null, blockedDays: [2, 3],
      len: { short: 70, medium: 70, long: 70 }, q: { solo: 73, team: 73 }, cons: 70,
      skill: { explain: 60, unclear: 82, urgent: 60, detail: 47, people: 66, steady: 47 } }
  };
  var ORDER = ["ama", "kofi", "yaw", "efua", "selorm"];

  // Week 1 = working days 0-4 from today (Tuesday). Selorm is away on days 2 and 3 (Thursday, Friday).
  function cap(p, week) {
    var c = p.week;
    if (week === 1 && p.blockedDays) c = p.week * (5 - p.blockedDays.length) / 5;
    return c;
  }

  var GOOD = { // evidence phrases, taken from the records
    ama: { detail: "caught 91% of errors in 23 checks", steady: "long jobs 91% on time", unclear: "spots what others miss", explain: "weak in heavy meetings", urgent: "short urgent jobs 58% on time", people: "weak in heavy meetings" },
    kofi: { explain: "18 sessions rated 4.6/5, won over 7 of 9 resistant stakeholders", people: "won over 7 of 9 resistant stakeholders", detail: "solo detail work: 38% rework", steady: "interest fades after about 3 weeks", unclear: "no record on unclear work", urgent: "short jobs 66% on time" },
    yaw: { detail: "weekly output varies only ±4%", steady: "weekly output varies only ±4%", urgent: "urgent jobs 71% on time and strained", unclear: "plan changes push rework to 19%", explain: "no training record", people: "calm in small teams" },
    efua: { urgent: "6 of 6 overnight or emergency drills on time", detail: "errors rise after day 4", steady: "output down 45% by week 3", unclear: "no record on unclear work", explain: "lifts team morale in bursts", people: "lifts team morale in bursts" },
    selorm: { unclear: "usable route on 9 of 11 unclear tasks", detail: "repetitive tasks 47% on time, quality 61%", steady: "repetitive tasks 47% on time, quality 61%", people: "best in teams of 2 to 4", explain: "no training record", urgent: "no emergency record" }
  };

  // need: weights over four parts: len (on-time for this task length), qual (quality in this mode), cons (consistency), skill.
  var TASKS = [
    { id: 4, title: "Reconcile bill-pay payments", hours: 8, due: 3, cls: "medium", mode: "solo", skill: "detail", w: { len: .2, qual: .35, cons: .15, skill: .3 }, minA: 9, hard: true, week: 1, note: "Needs accuracy 9, solo, careful." },
    { id: 3, title: "End-to-end day-one test", hours: 12, due: 3, cls: "medium", mode: "solo", skill: "detail", w: { len: .25, qual: .35, cons: .15, skill: .25 }, minA: 8, hard: true, week: 1, after: 4, note: "Accuracy 8+, uninterrupted. Sign-off only after task 4 is done." },
    { id: 2, title: "Support-desk script", hours: 8, due: 3, cls: "medium", mode: "solo", skill: "explain", w: { len: .2, qual: .3, cons: .2, skill: .3 }, review: 8, week: 1, note: "Exact wording: a reviewer with accuracy 8+ signs off." },
    { id: 1, title: "Agent training plan and slides", hours: 12, due: 6, cls: "medium", mode: "team", skill: "explain", w: { len: .15, qual: .25, cons: .1, skill: .5 }, review: 8, week: 2, note: "Compliance wording must be reviewed by accuracy 8+." },
    { id: 7, title: "Overnight failure drill", hours: 6, due: 5, cls: "short", mode: "solo", skill: "urgent", w: { len: .3, qual: .1, cons: .1, skill: .5 }, review: 8, week: 2, note: "Fast and comfortable with chaos. The report needs a careful reviewer." },
    { id: 8, title: "Field visits: what stops agents using bill-pay?", hours: 10, due: 6, cls: "medium", mode: "team", skill: "unclear", skill2: "people", w: { len: .1, qual: .15, cons: .1, skill: .4, skill2: .25 }, week: 2, team: "2 to 3 people", travel: "2 travel days", note: "Unclear job. Small team of 2 to 3, two travel days." },
    { id: 5, title: "Launch-day runbook and staffing rota", hours: 10, due: 8, cls: "medium", mode: "solo", skill: "detail", w: { len: .2, qual: .3, cons: .2, skill: .3 }, week: 2, after: 3, note: "Starts only after task 3 is half done." },
    { id: 6, title: "Weekly agent FAQ update", hours: 4, due: 12, cls: "long", mode: "solo", skill: "steady", w: { len: .25, qual: .25, cons: .25, skill: .25 }, week: 1, weekly: true, note: "4 h a week until launch. Steady and repeatable." },
    { id: 9, title: "Translate the agent guide into Twi and Ewe", hours: 8, due: 7, cls: "medium", mode: "solo", skill: "detail", w: { len: .2, qual: .3, cons: .2, skill: .3 }, week: 2, language: true, note: "Detailed and repetitive. No one on the team has a verified Twi or Ewe record." },
    { id: 10, title: "Book three training venues (Accra, Kumasi, Tamale)", hours: 4, due: 4, cls: "medium", mode: "team", skill: "people", w: { len: .15, qual: .2, cons: .15, skill: .5 }, week: 1, note: "People skills." },
    { id: 11, title: "Payment-failure bug found in testing", hours: 6, due: 1, cls: "short", mode: "solo", skill: "urgent", w: { len: .3, qual: .3, cons: .1, skill: .3 }, week: 1, surprise: true, needS: 8, needA: 8, note: "Needs fast AND accurate. Due day 2." }
  ];
  var BY_ID = {}; TASKS.forEach(function (t) { BY_ID[t.id] = t; });

  function eff(p, t) { return Math.round(t.hours * p.mult * 10) / 10; }
  function review(p, t) { return Math.max(1, Math.round(t.hours * 0.15 * 10) / 10); }

  function fitOf(p, t) {
    var vals = { len: p.len[t.cls], qual: p.q[t.mode], cons: p.cons, skill: p.skill[t.skill], skill2: t.skill2 ? p.skill[t.skill2] : 0 };
    var total = 0, sum = 0, parts = [];
    Object.keys(t.w).forEach(function (k) { total += t.w[k] * vals[k]; sum += t.w[k]; parts.push({ k: k, v: vals[k], w: t.w[k], c: t.w[k] * (vals[k] - 55) }); });
    var score = Math.round(total / sum);
    if (t.language) score = Math.min(score, 48);
    return { score: score, parts: parts };
  }

  function phrase(p, t, k) {
    if (k === "len") return p.len[t.cls] + "% on time on " + (t.cls === "short" ? "short" : t.cls === "long" ? "long" : "medium") + " tasks";
    if (k === "qual") return p.q[t.mode] + "% quality in " + (t.mode === "solo" ? "solo work" : "team work");
    if (k === "cons") return p.range ? "monthly on-time stays within " + p.range[0] + "–" + p.range[1] + "%" : "on time " + p.onTime + "% overall (no monthly spread yet)";
    var sk = k === "skill2" ? t.skill2 : t.skill;
    return GOOD[p.id][sk] || (sk + " " + p.skill[sk] + "/100");
  }

  function reasons(p, t, fit) {
    var best = fit.parts.slice().sort(function (a, b) { return b.c - a.c; }).slice(0, 2).map(function (x) { return phrase(p, t, x.k); });
    var worst = fit.parts.slice().sort(function (a, b) { return a.c - b.c; })[0];
    return { why: best, risk: phrase(p, t, worst.k), riskKey: worst.k };
  }

  function confidence(top, second) {
    var gap = top - (second == null ? 0 : second);
    if (top < 65) return "low";
    if (top >= 80 && gap >= 8) return "high";
    return "medium";
  }

  // Shortlist: the top person always; add the next ones only when the gap to the top is small (a genuinely hard pick).
  function shortlist(ranked) {
    var out = [ranked[0]];
    for (var i = 1; i < ranked.length && out.length < 3; i++) if (ranked[0].score - ranked[i].score <= 6) out.push(ranked[i]);
    return out;
  }

  function allocate(taskIds, opts) {
    opts = opts || {};
    var load = {}; ORDER.forEach(function (id) { load[id] = { 1: 0, 2: 0 }; });
    var res = {}, hardHeld = {};
    function add(pid, week, h) { load[pid][week] = Math.round((load[pid][week] + h) * 10) / 10; }
    // scarce, constrained tasks first
    taskIds.forEach(function (tid) {
      var t = BY_ID[tid]; var rows = ORDER.map(function (pid) {
        var p = PEOPLE[pid], f = fitOf(p, t), hrs = eff(p, t);
        var feasible = (!t.minA || p.A >= t.minA);
        var week = t.week, c = cap(p, week), after = load[pid][week] + hrs, util = after / c;
        var adj = f.score - (t.hard && hardHeld[pid] ? 12 : 0) - (util > 0.9 ? Math.min(20, Math.round((util - 0.9) * 100)) : 0);
        return { id: pid, p: p, fit: f, score: f.score, adj: adj, eff: hrs, util: util, after: after, cap: c, over: Math.max(0, Math.round((after - c) * 10) / 10), feasible: feasible };
      });
      var pool = rows.filter(function (r) { return r.feasible && !(opts.exclude && opts.exclude[tid] && opts.exclude[tid].indexOf(r.id) > -1); });
      pool.sort(function (a, b) { return b.adj - a.adj; });
      var ranked = pool.map(function (r) { return Object.assign({}, r, { score: r.adj }); });
      var top = ranked[0];
      var flags = [], roles = {};
      var noFit = top.fit.score < 60 || t.language;
      var rec = { task: t, ranked: ranked, noFit: noFit };
      if (!noFit) {
        var list = shortlist(ranked);
        roles.lead = top.id; add(top.id, t.week, top.eff); if (t.hard) hardHeld[top.id] = true;
        if (t.week === 1 && t.weekly) add(top.id, 2, top.eff);
        // reviewer: accuracy 8+ and not the lead
        if (t.review) {
          var rv = ORDER.map(function (pid) { return PEOPLE[pid]; }).filter(function (p) { return p.A >= t.review && p.id !== top.id; })
            .map(function (p) { var h = review(p, t); var after = load[p.id][t.week] + h; return { p: p, h: h, util: after / cap(p, t.week), after: after }; })
            .sort(function (a, b) { return a.util - b.util; })[0];
          if (rv) { roles.reviewer = rv.p.id; roles.reviewerHours = rv.h; add(rv.p.id, t.week, rv.h); }
        }
        // support: the next best different person when it is a team job or the lead has a real weakness
        if (t.mode === "team") {
          var sp = ranked.filter(function (r) { return r.id !== top.id && r.id !== roles.reviewer; })
            .sort(function (a, b) { return (0.6 * b.p.skill.people + 0.4 * b.fit.score) - (0.6 * a.p.skill.people + 0.4 * a.fit.score); })[0];
          if (sp) { roles.support = sp.id; }
        }
        var back = ranked.filter(function (r) { return r.id !== top.id && r.id !== roles.reviewer && r.id !== roles.support; })[0];
        if (back) roles.backup = back.id;
        rec.shortlist = list; rec.roles = roles;
        rec.confidence = confidence(top.fit.score, ranked[1] && ranked[1].fit.score);
        rec.reason = reasons(top.p, t, top.fit);
        if (top.util >= 0.9) rec.flags = ["At capacity: " + Math.round(top.util * 100) + "% of " + top.p.week + " h"];
        if (top.id === "selorm" && t.id === 8) rec.flags = (rec.flags || []).concat(["Away Thursday and Friday: 2 days blocked"]);
        // not recommended: lowest fit with a stat
        var worst = rows.slice().sort(function (a, b) { return a.score - b.score; })[0];
        var wr = reasons(worst.p, t, worst.fit);
        rec.notRec = { id: worst.id, because: wr.risk };
      } else {
        rec.shortlist = ranked.slice(0, 2); rec.roles = {}; rec.confidence = "low";
        rec.options = t.language ? ["Split it: one person drafts, a native speaker checks", "Pair a careful person with a Twi/Ewe speaker", "Extend the deadline", "Buy help: a freelance translator"] : [];
        rec.reason = { why: [], risk: t.language ? "no verified Twi or Ewe record on the team" : "no strong fit" };
      }
      res[tid] = rec;
    });
    return { res: res, load: load };
  }

  // Next-best list for "Find someone else", with warnings.
  function alternatives(tid, excludeIds, loadNow) {
    var t = BY_ID[tid];
    return ORDER.filter(function (id) { return excludeIds.indexOf(id) < 0; }).map(function (pid) {
      var p = PEOPLE[pid], f = fitOf(p, t), hrs = eff(p, t), c = cap(p, t.week), after = ((loadNow && loadNow[pid] && loadNow[pid][t.week]) || 0) + hrs;
      var r = reasons(p, t, f), warn = [];
      if (after / c > 0.9) warn.push(after > c ? "Over by " + (Math.round((after - c) * 10) / 10) + " h" : "At capacity (" + Math.round(after / c * 100) + "%)");
      if (t.minA && p.A < t.minA) warn.push("Accuracy " + p.A + " is below the " + t.minA + " needed");
      if (t.travel && pid === "selorm") warn.push("Blocked Thursday and Friday");
      if (t.mode === "team" && pid === "ama") warn.push("Interruptions and meetings slow her sharply");
      return { id: pid, p: p, score: f.score, eff: hrs, why: r.why, risk: r.risk, warn: warn, util: after / c };
    }).sort(function (a, b) { return b.score - a.score; });
  }

  // Task 11 needs fast AND accurate. No single person has both, so find the best pair.
  function pairFor(tid, loadNow) {
    var t = BY_ID[tid], best = null;
    var load = function (id) { return (loadNow && loadNow[id] && loadNow[id][t.week]) || 0; };
    ORDER.forEach(function (a) { ORDER.forEach(function (b) {
      if (a === b) return; var pa = PEOPLE[a], pb = PEOPLE[b];
      if (pa.S < t.needS || pb.A < t.needA) return; // a = fast, b = accurate
      var fastH = Math.round(t.hours * 0.6 * pa.mult * 10) / 10, checkH = Math.round(t.hours * 0.4 * 10) / 10;
      var uA = (load(a) + fastH) / cap(pa, 1), uB = (load(b) + checkH) / cap(pb, 1);
      var score = (pa.S * 4) + (pb.A * 4) - Math.max(0, uA - .9) * 100 - Math.max(0, uB - .9) * 100 + pb.O;
      if (!best || score > best.score) best = { fast: a, check: b, fastH: fastH, checkH: checkH, uA: uA, uB: uB, score: score, overB: Math.max(0, Math.round((load(b) + checkH - cap(pb, 1)) * 10) / 10) };
    }); });
    var single = ORDER.filter(function (id) { return PEOPLE[id].S >= t.needS && PEOPLE[id].A >= t.needA; });
    return { pair: best, single: single };
  }

  var api = { PEOPLE: PEOPLE, ORDER: ORDER, TASKS: TASKS, BY_ID: BY_ID, cap: cap, eff: eff, fitOf: fitOf, phrase: phrase, allocate: allocate, alternatives: alternatives, pairFor: pairFor, shortlist: shortlist };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.ENGINE = api;
})(typeof window !== "undefined" ? window : this);
