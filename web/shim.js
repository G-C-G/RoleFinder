/* GCG Game Plan website layer.
   Gives the app the same three features it gets inside Claude (db, user, downloads),
   backed by Supabase. Sign-in is email and password. Nothing in the app itself changes. */
(function () {
  "use strict";
  var cfg = window.GCG_CONFIG || {};
  var sb = window.__sb || null; // tests inject a fake client here

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "style") n.setAttribute("style", attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  /* ---------- sign-in screen ---------- */
  var sessionP = null;
  function needSession() {
    if (sessionP) return sessionP;
    sessionP = new Promise(function (resolve) {
      function done(session) { var o = document.getElementById("gcgAuth"); if (o) o.remove(); resolve(session); }
      sb.auth.getSession().then(function (r) {
        var s = r && r.data && r.data.session;
        if (s) { done(s); return; }
        showLogin(done);
      }).catch(function () { showLogin(done); });
    });
    return sessionP;
  }

  function showLogin(done) {
    var mode = "in";
    var msg = el("p", { id: "gcgAuthMsg", role: "status", "aria-live": "polite", style: "min-height:1.4em;margin:0;font-weight:700" });
    var email = el("input", { id: "gcgEmail", type: "email", autocomplete: "email", placeholder: "Email", style: "width:100%;box-sizing:border-box;padding:12px;font-size:16px;border:2px solid #1a1611;border-radius:12px" });
    var pass = el("input", { id: "gcgPass", type: "password", autocomplete: "current-password", placeholder: "Password (8 or more characters)", style: "width:100%;box-sizing:border-box;padding:12px;font-size:16px;border:2px solid #1a1611;border-radius:12px" });
    var go = el("button", { id: "gcgAuthGo", type: "button", text: "Sign in", style: "padding:14px;font-size:17px;font-weight:800;border:2.5px solid #1a1611;border-radius:14px;background:#f6b80f;color:#1b1611;cursor:pointer" });
    var swap = el("button", { id: "gcgAuthSwap", type: "button", text: "New here? Create an account", style: "background:none;border:0;text-decoration:underline;font-size:15px;cursor:pointer;color:inherit" });
    var title = el("h1", { text: "GCG Game Plan", style: "margin:0;font-size:1.8rem" });
    var sub = el("p", { text: "Sign in to open your Game Plan.", style: "margin:0" });
    var card = el("div", { style: "max-width:420px;margin:0 auto;display:grid;gap:12px;background:#fffdf8;color:#1a1611;border:2.5px solid #1a1611;border-radius:22px;padding:22px" }, [title, sub, email, pass, go, msg, swap]);
    var wrap = el("div", { id: "gcgAuth", style: "position:fixed;inset:0;z-index:9999;background:#f6f1e6;padding:24px 16px;overflow:auto" }, [card]);
    document.body.appendChild(wrap);

    function setMode(m) {
      mode = m;
      go.textContent = m === "in" ? "Sign in" : "Create my account";
      swap.textContent = m === "in" ? "New here? Create an account" : "Already have an account? Sign in";
      pass.setAttribute("autocomplete", m === "in" ? "current-password" : "new-password");
      msg.textContent = "";
    }
    swap.onclick = function () { setMode(mode === "in" ? "up" : "in"); };

    function say(t, bad) { msg.textContent = t; msg.style.color = bad ? "#b3261e" : "#12894a"; }
    function plain(e) {
      var t = String((e && (e.message || e.error_description)) || e || "");
      if (/invalid login/i.test(t)) return "That email and password do not match. Check them, or create an account.";
      if (/already registered|already been registered/i.test(t)) return "That email already has an account. Tap Sign in instead.";
      if (/password/i.test(t) && /(short|least|weak)/i.test(t)) return "Choose a password with at least 8 characters.";
      if (/rate limit|too many/i.test(t)) return "Too many tries. Wait a minute and try again.";
      if (/confirm/i.test(t)) return "Check your email and open the confirmation link, then sign in.";
      return "Could not sign you in (" + t.slice(0, 120) + "). Try again.";
    }
    go.onclick = function () {
      var em = email.value.trim(), pw = pass.value;
      if (!/^\S+@\S+\.\S+$/.test(em)) { say("Enter a valid email address.", true); return; }
      if (pw.length < 8) { say("Choose a password with at least 8 characters.", true); return; }
      go.disabled = true; say("One moment...");
      var p = mode === "in" ? sb.auth.signInWithPassword({ email: em, password: pw }) : sb.auth.signUp({ email: em, password: pw });
      p.then(function (r) {
        go.disabled = false;
        if (r && r.error) { say(plain(r.error), true); return; }
        var s = r && r.data && r.data.session;
        if (s) { done(s); return; }
        say("Check your email and open the confirmation link, then come back and sign in.");
        setMode("in");
      }).catch(function (e) { go.disabled = false; say(plain(e), true); });
    };
  }

  /* ---------- user ---------- */
  var roleP = null;
  function role() {
    if (roleP) return roleP;
    roleP = needSession().then(function (s) {
      return sb.from("profiles").select("role").eq("id", s.user.id).maybeSingle().then(function (r) {
        return (r && r.data && r.data.role) || "member";
      });
    }).catch(function () { return "member"; });
    return roleP;
  }
  var user = {
    id: function () { return needSession().then(function (s) { return s.user.id; }); },
    canEdit: function () { return role().then(function (r) { return r === "admin"; }); },
    isOwner: function () { return role().then(function (r) { return r === "admin"; }); },
    can: function (what) { return needSession().then(function () { return what === "data.write" ? true : null; }); }
  };

  /* ---------- db ---------- */
  var watchers = []; // {col, path, fire}
  function ofCol(path) { return String(path).split("/")[0]; }
  function snapDoc(path, row) {
    var d = row ? row.data : undefined;
    return { id: String(path).split("/").pop(), exists: !!row, data: function () { return d; } };
  }
  function fail(e) { var x = new Error((e && e.message) || "database error"); x.code = (e && (e.code || e.status)) || "error"; return x; }
  function touch(path) { watchers.slice().forEach(function (w) { if (w.col === ofCol(path)) w.fire(); }); }

  function readDoc(path) {
    return sb.from("docs").select("data").eq("path", path).maybeSingle().then(function (r) {
      if (r.error) throw fail(r.error);
      return snapDoc(path, r.data);
    });
  }
  function readCol(name) {
    return sb.from("docs").select("path,data").like("path", name + "/%").not("path", "like", name + "/%/%").then(function (r) {
      if (r.error) throw fail(r.error);
      var docs = (r.data || []).map(function (row) { return snapDoc(row.path, row); });
      return { docs: docs, size: docs.length, empty: !docs.length, forEach: function (f) { docs.forEach(f); } };
    });
  }
  var chanN = 0;
  function listen(col, read, cb, errCb) {
    var live = true, timer = null;
    function run() { read().then(function (s) { if (live) cb(s); }, function (e) { if (live && errCb) errCb(e); }); }
    function fire() { clearTimeout(timer); timer = setTimeout(run, 40); }
    var w = { col: col, fire: fire };
    watchers.push(w);
    var ch = null;
    try {
      ch = sb.channel("gcg-" + col + "-" + (++chanN))
        .on("postgres_changes", { event: "*", schema: "public", table: "docs", filter: "col=eq." + col }, fire)
        .subscribe();
    } catch (e) { /* live updates are optional; the first read still happens */ }
    run();
    return function () { live = false; clearTimeout(timer); watchers = watchers.filter(function (x) { return x !== w; }); if (ch && sb.removeChannel) sb.removeChannel(ch); };
  }

  var db = {
    doc: function (path) {
      return {
        get: function () { return readDoc(path); },
        set: function (data) {
          return sb.from("docs").upsert({ path: path, data: data, updated_at: new Date().toISOString() }).then(function (r) {
            if (r.error) throw fail(r.error);
            touch(path);
          });
        },
        delete: function () {
          return sb.from("docs").delete().eq("path", path).then(function (r) {
            if (r.error) throw fail(r.error);
            touch(path);
          });
        },
        onSnapshot: function (cb, errCb) { return listen(ofCol(path), function () { return readDoc(path); }, cb, errCb); }
      };
    },
    collection: function (name) {
      return {
        get: function () { return readCol(name); },
        onSnapshot: function (cb, errCb) { return listen(name, function () { return readCol(name); }, cb, errCb); }
      };
    }
  };

  /* ---------- downloads ---------- */
  var downloads = {
    save: function (o) {
      return new Promise(function (resolve, reject) {
        try {
          var blob = new Blob([o.data]);
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob); a.download = o.filename || "file";
          document.body.appendChild(a); a.click();
          setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
          resolve({ saved: true });
        } catch (e) { reject({ code: "failed", message: String(e) }); }
      });
    }
  };

  /* ---------- window.claude ---------- */
  function start() {
    if (!sb) {
      if (!window.supabase || !cfg.url || !cfg.anonKey) { return; }
      sb = window.supabase.createClient(cfg.url, cfg.anonKey);
    }
    window.claude = {
      use: function (name) {
        if (name === "downloads") return Promise.resolve(downloads);
        if (name === "db") return needSession().then(function () { return db; });
        if (name === "user") return needSession().then(function () { return user; });
        return Promise.resolve(null);
      }
    };
  }
  start();
  window.__gcgShim = { db: db, user: user };
})();
