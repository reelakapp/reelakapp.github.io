/* Reelak landing page: the waitlist form and the small live demos. No libraries. */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var FA = "۰۱۲۳۴۵۶۷۸۹";
  function fa(text) { return String(text).replace(/\d/g, function (d) { return FA[d]; }); }
  function groups(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "٬"); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { /* private mode: fine */ }
    return null;
  }

  /** Runs fn(true/false) as the element enters/leaves the screen. */
  function watch(el, fn, margin) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(true); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { fn(e.isIntersecting); });
    }, { rootMargin: margin || "0px" }).observe(el);
  }

  // ------------------------------------------------------------ nav + reveal
  var nav = $(".nav");
  function onScroll() { if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$(".reveal").forEach(function (el, i) {
      // Neighbours come in one after another.
      var sibs = el.parentElement ? $$(":scope > .reveal", el.parentElement) : [];
      var idx = sibs.indexOf(el);
      if (idx > 0) el.style.transitionDelay = Math.min(idx, 6) * 70 + "ms";
      io.observe(el);
    });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  // ------------------------------------------------------------ phone menu
  var menuBtn = $("[data-menu-btn]");
  var menu = $("[data-menu]");
  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "بستن منو" : "منو");
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () { setMenu(menu.hidden); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    document.addEventListener("click", function (e) { if (!menu.hidden && !nav.contains(e.target)) setMenu(false); });
  }

  // ------------------------------------------------------------ hero title: like a caption
  var kws = $$(".hero-title .kw");
  if (reduced) {
    kws.forEach(function (k) { k.classList.add("is-in"); });
  } else {
    kws.forEach(function (k, i) { setTimeout(function () { k.classList.add("is-in"); }, 120 + i * 85); });
    var start = 120 + kws.length * 85 + 250;
    kws.forEach(function (k, i) {
      if (k.classList.contains("kw-brand")) return;
      setTimeout(function () { k.classList.add("is-said"); }, start + i * 260);
      setTimeout(function () { k.classList.remove("is-said"); }, start + i * 260 + 330);
    });
  }

  // ------------------------------------------------------------ waitlist
  function source() {
    var q = new URLSearchParams(location.search);
    var s = q.get("ref") || q.get("utm_source") || q.get("src") || "";
    if (!s && document.referrer) {
      if (/instagram\./i.test(document.referrer)) s = "instagram";
      else if (/t\.me|telegram/i.test(document.referrer)) s = "telegram";
    }
    return s.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 40);
  }
  function toLatin(text) {
    return String(text)
      .replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); })
      .replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); });
  }
  function cleanPhone(text) {
    var digits = toLatin(text).replace(/\D/g, "");
    var m = digits.match(/^(?:0098|98|0)?(9\d{9})$/);
    return m ? "0" + m[1] : null;
  }
  function pretty(text) {
    var d = toLatin(text).replace(/[^\d+]/g, "");
    if (/^09\d*$/.test(d)) return [d.slice(0, 4), d.slice(4, 7), d.slice(7, 11)].filter(Boolean).join(" ");
    return d;
  }

  var joins = $$("[data-join]");

  function showDone(result) {
    joins.forEach(function (j) {
      var form = $(".join-form", j);
      var done = $(".join-done", j);
      if (!form || !done) return;
      var title = $("[data-done-title]", j);
      var sub = $(".done-sub", j);
      if (title) title.textContent = result.already ? "این شماره از قبل توی لیسته 👌" : "ثبت شد! 🎉";
      if (sub && result.position) {
        sub.textContent = "جای تو توی صف: " + fa(groups(result.position)) + ". روز عرضه با یک پیامک خبرت می‌کنیم.";
      }
      form.hidden = true;
      done.hidden = false;
    });
  }

  function setHint(form, text, isError) {
    var hint = $(".join-hint", form);
    if (!hint) return;
    if (!hint.dataset.original) hint.dataset.original = hint.textContent;
    hint.textContent = text || hint.dataset.original;
    hint.classList.toggle("is-error", !!isError);
  }

  joins.forEach(function (j) {
    var form = $(".join-form", j);
    if (!form) return;
    var input = $('input[name="phone"]', form);
    var field = $(".phone-field", form);
    var button = $('button[type="submit"]', form);
    var src = $('input[name="source"]', form);
    if (src) src.value = source();

    input.addEventListener("input", function () {
      var caretAtEnd = input.selectionStart === input.value.length;
      var next = pretty(input.value);
      if (next !== input.value && caretAtEnd) input.value = next;
      field.classList.remove("is-bad");
      setHint(form, "", false);
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (button.classList.contains("is-loading")) return;
      var phone = cleanPhone(input.value);
      if (!phone) {
        field.classList.remove("is-bad");
        void field.offsetWidth;
        field.classList.add("is-bad");
        setHint(form, "شماره موبایل رو کامل بنویس؛ مثل ۰۹۱۲۳۴۵۶۷۸۹", true);
        input.focus();
        return;
      }
      button.classList.add("is-loading");
      button.disabled = true;
      // The form's own address: /api/waitlist on Liara, the Supabase function on the copy
      // outside Iran (D110). There the JSON goes as plain text, so the browser sends it in
      // one trip instead of asking the other server first (slow on a VPN).
      var api = form.getAttribute("action") || "/api/waitlist";
      var cross = /^https?:/i.test(api) && api.indexOf(location.origin + "/") !== 0;
      fetch(api, {
        method: "POST",
        headers: { "Content-Type": cross ? "text/plain;charset=UTF-8" : "application/json", Accept: "application/json" },
        body: JSON.stringify({ phone: phone, source: source(), website: ($('input[name="website"]', form) || {}).value || "" }),
      })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (data) {
          if (data && data.ok) {
            store("reelak-joined", JSON.stringify({ position: data.position || null }));
            showDone(data);
            burst(button);
          } else {
            setHint(form, (data && data.message) || "یه مشکل موقت پیش اومد. دوباره امتحان کن.", true);
            if (data && data.error === "bad_phone") field.classList.add("is-bad");
          }
        })
        .catch(function () { setHint(form, "اینترنت قطع شد؟ دوباره امتحان کن.", true); })
        .then(function () { button.classList.remove("is-loading"); button.disabled = false; });
    });
  });

  // Came back after joining (or the no-JavaScript form sent us here).
  (function () {
    var q = new URLSearchParams(location.search);
    if (q.has("joined")) { showDone({ position: Number(toLatin(q.get("joined"))) || null }); return; }
    var saved = store("reelak-joined");
    if (saved) { try { showDone(JSON.parse(saved)); } catch (e) { /* ignore */ } }
    if (q.get("error")) {
      var form = $(".join-form");
      if (form) setHint(form, q.get("error") === "too_many" ? "چند بار پشت سر هم امتحان کردی. چند دقیقه دیگه دوباره بزن." : "شماره موبایل رو کامل بنویس؛ مثل ۰۹۱۲۳۴۵۶۷۸۹", true);
    }
  })();

  // Lime confetti from the button.
  function burst(from) {
    if (reduced || !from) return;
    var r = from.getBoundingClientRect();
    for (var i = 0; i < 26; i++) {
      var p = document.createElement("i");
      var size = 5 + Math.random() * 7;
      p.style.cssText = "position:fixed;z-index:90;pointer-events:none;border-radius:" + (Math.random() > .5 ? "50%" : "2px") +
        ";width:" + size + "px;height:" + size + "px;background:" + (Math.random() > .25 ? "#D4FF3A" : "#F4F4F5") +
        ";left:" + (r.left + r.width / 2) + "px;top:" + (r.top + r.height / 2) + "px";
      document.body.appendChild(p);
      var a = Math.random() * Math.PI * 2;
      var d = 60 + Math.random() * 140;
      p.animate([
        { transform: "translate(0,0) rotate(0)", opacity: 1 },
        { transform: "translate(" + Math.cos(a) * d + "px," + (Math.sin(a) * d - 60) + "px) rotate(" + (Math.random() * 540) + "deg)", opacity: 0 },
      ], { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
  }

  // Share
  $$("[data-share]").forEach(function (b) {
    b.addEventListener("click", function () {
      var url = location.href.split(/[?#]/)[0].replace(/index\.html$/, "") + "?ref=friend";
      var text = "ریلک: زیرنویس فارسی خودکار + دایرکت خودکار اینستاگرام. من توی لیست انتظارم، تو هم بیا:";
      if (navigator.share) {
        navigator.share({ title: "ریلک", text: text, url: url }).catch(function () {});
        return;
      }
      var label = $("span", b);
      var done = function () { if (label) { label.textContent = "لینک کپی شد ✓"; setTimeout(function () { label.textContent = "فرستادن برای دوستام"; }, 2200); } };
      if (navigator.clipboard) navigator.clipboard.writeText(text + " " + url).then(done, done);
      else done();
    });
  });

  // "Join" buttons elsewhere jump to the form and open the keyboard.
  $$("[data-focus-phone], [data-store]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      if (a.getAttribute("href") !== "#waitlist") return;
      ev.preventDefault();
      var hero = $("#waitlist");
      var input = $("#phone-hero");
      hero.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      if (input && !$(".join-form").hidden) setTimeout(function () { input.focus({ preventScroll: true }); }, 450);
    });
  });

  // Sticky button on phones: only when no form is on screen.
  var sticky = $("[data-sticky]");
  if (sticky) {
    var seen = { hero: true, final: false };
    var update = function () { sticky.classList.toggle("is-on", !seen.hero && !seen.final); };
    watch($(".hero .join") || $(".hero .stores"), function (v) { seen.hero = v; update(); });
    watch($(".final"), function (v) { seen.final = v; update(); });
  }

  // ------------------------------------------------------------ the phone demo
  var demo = $("[data-demo]");
  if (demo) (function () {
    var W = [
      // [word, start, end, screen, scene]
      ["این", 0.3, 0.65, 0, 0], ["کافه", 0.65, 1.1, 0, 0], ["رو", 1.1, 1.45, 0, 0],
      ["حتماً", 1.65, 2.05, 1, 0], ["باید", 2.05, 2.4, 1, 0], ["امتحان", 2.4, 2.95, 1, 0], ["کنی", 2.95, 3.35, 1, 0],
      ["بهترین", 3.6, 4.15, 2, 0], ["لاته‌ی", 4.15, 4.65, 2, 0], ["شهر 🔥", 4.65, 5.5, 2, 0],
      ["این", 6.6, 6.95, 3, 1], ["کیفا", 6.95, 7.4, 3, 1], ["رو", 7.4, 7.7, 3, 1], ["ببین", 7.7, 8.2, 3, 1],
      ["قیمت", 8.45, 8.85, 4, 1], ["و", 8.85, 9.0, 4, 1], ["سفارش؟", 9.0, 9.65, 4, 1],
      ["کامنت", 9.9, 10.35, 5, 1], ["کن", 10.35, 10.6, 5, 1], ["«لینک»", 10.6, 11.3, 5, 1],
    ];
    var SFX = [[3.6, "🔊 پاپ"], [6.6, "🔊 ووش"], [10.6, "🔊 دینگ"]];
    var TOTAL = 13;
    var SCENE_AT = 6.3;
    var PPS = 82; // timeline pixels per second

    var cap = $("[data-cap]", demo);
    var cta = $("[data-cta]", demo);
    var notif = $("[data-notif]", demo);
    var prog = $("[data-progress]", demo);
    var time = $("[data-time]", demo);
    var track = $("[data-track]", demo);
    var scenes = $$("[data-scene]", demo);
    var laneW = $("[data-lane-words]", demo);
    var laneWave = $("[data-lane-wave]", demo);
    var laneSfx = $("[data-lane-sfx]", demo);

    // Build the timeline lanes once.
    var chips = W.map(function (w) {
      var el = document.createElement("span");
      el.className = "w";
      el.textContent = w[0];
      el.style.left = (w[1] * PPS) + "px";
      el.style.width = Math.max(18, (w[2] - w[1]) * PPS - 3) + "px";
      laneW.appendChild(el);
      return el;
    });
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var x = 0; x < TOTAL * PPS; x += 4) {
      var t = x / PPS;
      var loud = W.some(function (w) { return t >= w[1] - 0.05 && t <= w[2]; });
      var bar = document.createElement("i");
      bar.style.height = Math.round(loud ? 6 + rnd() * 18 : 2 + rnd() * 3) + "px";
      laneWave.appendChild(bar);
    }
    SFX.forEach(function (s) {
      var el = document.createElement("span");
      el.className = "sfx-chip";
      el.textContent = s[1];
      el.style.left = (s[0] * PPS) + "px";
      laneSfx.appendChild(el);
    });
    var totalLabel = fa("0:" + String(TOTAL).padStart(2, "0"));

    var shownScreen = -1;
    var spans = [];
    function render(t) {
      // scene
      var scene = t < SCENE_AT ? 0 : 1;
      scenes.forEach(function (s, i) { s.classList.toggle("is-on", i === scene); });
      // which caption screen
      var screen = -1;
      for (var i = 0; i < W.length; i++) if (W[i][1] <= t) screen = W[i][3];
      var last = W.filter(function (w) { return w[3] === screen; }).pop();
      if (last && t > last[2] + 0.9 && !(screen === 5)) screen = -1;
      if (screen === 2 && t > SCENE_AT - 0.2) screen = -1;
      if (screen !== shownScreen) {
        shownScreen = screen;
        cap.textContent = "";
        spans = [];
        W.forEach(function (w, idx) {
          if (w[3] !== screen) return;
          var s = document.createElement("span");
          s.textContent = w[0];
          s.dataset.idx = idx;
          cap.appendChild(s);
          spans.push(s);
        });
      }
      spans.forEach(function (s) {
        var w = W[+s.dataset.idx];
        s.classList.toggle("is-in", t >= w[1]);
        s.classList.toggle("is-now", t >= w[1] && t < w[2]);
      });
      chips.forEach(function (c, idx) { c.classList.toggle("is-now", t >= W[idx][1] && t < W[idx][2]); });
      cta.classList.toggle("is-on", t > 10.6 && t < TOTAL - 0.2);
      notif.classList.toggle("is-on", t > 11.4 && t < TOTAL - 0.3);
      track.style.transform = "translateX(" + (-t * PPS) + "px)";
      prog.style.width = (t / TOTAL * 100) + "%";
      time.textContent = fa("0:" + String(Math.floor(t)).padStart(2, "0")) + " / " + totalLabel;
    }

    if (reduced) { render(10.9); return; }
    var running = false;
    var t0 = 0;
    var offset = 0;
    function frame(now) {
      if (!running) return;
      var t = ((now - t0) / 1000 + offset) % TOTAL;
      render(t);
      requestAnimationFrame(frame);
    }
    watch(demo, function (visible) {
      if (visible && !running) {
        running = true;
        t0 = performance.now();
        requestAnimationFrame(frame);
      } else if (!visible && running) {
        running = false;
        offset = ((performance.now() - t0) / 1000 + offset) % TOTAL;
      }
    });
  })();

  // ------------------------------------------------------------ caption style cards
  $$("[data-styles] .st-text").forEach(function (p) {
    $$("span", p).forEach(function (s, i) { s.style.setProperty("--i", i); });
  });

  // ------------------------------------------------------------ caption styles: slide by itself on phones
  var rail = $("[data-styles]");
  if (rail) (function () {
    var cards = $$(".style-card", rail);
    var dots = document.createElement("div");
    dots.className = "style-dots";
    dots.setAttribute("aria-hidden", "true");
    cards.forEach(function () { dots.appendChild(document.createElement("i")); });
    rail.parentNode.insertBefore(dots, rail.nextSibling);
    var dotEls = $$("i", dots);

    function scrollable() { return rail.scrollWidth > rail.clientWidth + 4; }
    function current() {
      var mid = rail.getBoundingClientRect();
      var c = mid.left + mid.width / 2;
      var best = 0;
      var bestD = Infinity;
      cards.forEach(function (card, i) {
        var r = card.getBoundingClientRect();
        var d = Math.abs(r.left + r.width / 2 - c);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    }
    function goTo(i) {
      var card = cards[i];
      var r = card.getBoundingClientRect();
      var m = rail.getBoundingClientRect();
      rail.scrollBy({ left: r.left + r.width / 2 - (m.left + m.width / 2), behavior: reduced ? "auto" : "smooth" });
    }
    function paint() {
      var k = current();
      dotEls.forEach(function (d, i) { d.classList.toggle("on", i === k); });
    }
    rail.addEventListener("scroll", function () { requestAnimationFrame(paint); }, { passive: true });
    paint();

    // Moves to the next style every few seconds; waits a bit after the person touches it.
    var timer = null;
    var pausedUntil = 0;
    function tick() {
      if (!scrollable() || Date.now() < pausedUntil) return;
      goTo((current() + 1) % cards.length);
    }
    ["touchstart", "pointerdown", "wheel"].forEach(function (ev) {
      rail.addEventListener(ev, function () { pausedUntil = Date.now() + 6000; }, { passive: true });
    });
    if (reduced) return;
    watch(rail, function (v) {
      if (v && !timer) timer = setInterval(tick, 2600);
      else if (!v && timer) { clearInterval(timer); timer = null; }
    }, "-20% 0px");
  })();

  // ------------------------------------------------------------ word timing tile
  var wd = $("[data-wave-demo]");
  if (wd) (function () {
    var words = $$(".wd-words span", wd);
    var barsBox = $(".wd-bars", wd);
    var per = 10;
    var bars = [];
    var s = 3;
    for (var i = 0; i < words.length * per; i++) {
      s = (s * 9301 + 49297) % 233280;
      var b = document.createElement("i");
      var edge = i % per === 0 || i % per === per - 1;
      b.style.height = Math.round((edge ? 8 : 16) + (s / 233280) * (edge ? 10 : 42)) + "px";
      barsBox.appendChild(b);
      bars.push(b);
    }
    // Bars run left→right like the app's timeline; words are read right→left.
    var k = 0;
    var timer = null;
    function step() {
      words.forEach(function (w, i) { w.classList.toggle("is-now", i === k); });
      bars.forEach(function (b, i) { b.classList.toggle("is-now", Math.floor(i / per) === k); });
      k = (k + 1) % (words.length + 1);
    }
    if (reduced) { k = 2; step(); return; }
    watch(wd, function (v) {
      if (v && !timer) timer = setInterval(step, 620);
      else if (!v && timer) { clearInterval(timer); timer = null; }
    });
  })();

  // ------------------------------------------------------------ AI caption typing
  var typing = $("[data-typing]");
  if (typing) (function () {
    var full = typing.textContent.trim();
    var chars = Array.from(full);
    if (reduced) return;
    var n = 0;
    var timer = null;
    function tick() {
      n++;
      if (n <= chars.length) typing.textContent = chars.slice(0, n).join("");
      if (n > chars.length + 45) { n = 0; typing.textContent = ""; }
    }
    typing.textContent = "";
    watch(typing, function (v) {
      if (v && !timer) timer = setInterval(tick, 55);
      else if (!v && timer) { clearInterval(timer); timer = null; }
    });
  })();

  // ------------------------------------------------------------ the DM conversation
  var chat = $("[data-chat]");
  if (chat) (function () {
    var items = $$("[data-c]", chat);
    var steps = $$("[data-auto-steps] li");
    var dots = $("[data-typing-dots]", chat);
    // [what appears, after ms, typing first? ("me"/"them"), step to light]
    var plan = [
      [0, 500, null, 0],
      [1, 1300, null, 1],
      [2, 1500, "me", 0],
      [3, 1700, "them", 2],
      [4, 1600, "me", 2],
      [5, 1400, "me", 3],
      [6, 1500, "them", 3],
      [7, 1000, null, 3],
    ];
    function light(i) { steps.forEach(function (s, j) { s.classList.toggle("is-on", j === i); }); }
    function showUpTo(c) { items.forEach(function (el) { el.classList.toggle("is-in", +el.dataset.c <= c); }); }
    if (reduced) { showUpTo(7); light(3); return; }

    var timers = [];
    var running = false;
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function run() {
      clear();
      showUpTo(-1);
      light(-1);
      var at = 300;
      plan.forEach(function (p) {
        if (p[2]) {
          timers.push(setTimeout(function () { dots.className = "typing-dots is-on is-" + p[2]; }, at + p[1] - 900));
        }
        at += p[1];
        timers.push(setTimeout(function () {
          dots.className = "typing-dots";
          showUpTo(p[0]);
          light(p[3]);
        }, at));
      });
      timers.push(setTimeout(run, at + 4500));
    }
    watch(chat, function (v) {
      if (v && !running) { running = true; run(); }
      else if (!v && running) { running = false; clear(); }
    }, "-10% 0px");
  })();

  // ------------------------------------------------------------ pricing
  var period = $("[data-period]");
  if (period) (function () {
    var price = $("[data-price]");
    var note = $("[data-price-note]");
    var sub = $("[data-price-sub]");
    var P = {
      1: { total: 369000, note: "تومان در ماه", sub: "" },
      3: { total: 659000, note: "تومان برای ۳ ماه", sub: "ماهی " + fa(groups(659000 / 3)) + " تومان · ٪" + fa(40) + " ارزون‌تر" },
      12: { total: 1849000, note: "تومان برای ۱۲ ماه", sub: "ماهی " + fa(groups(1849000 / 12)) + " تومان · ٪" + fa(58) + " ارزون‌تر" },
    };
    $$("button", period).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("button", period).forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
        var p = P[b.dataset.months];
        price.textContent = fa(groups(p.total));
        note.textContent = p.note;
        sub.textContent = p.sub || " ";
        price.classList.remove("is-tick");
        void price.offsetWidth;
        price.classList.add("is-tick");
      });
    });
  })();
})();
