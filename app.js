/* The Ceremony · Decisio Year in Review (Direction D)
   One persistent stage (spotlight, beam, confetti) with six chapters
   choreographed on GSAP timelines. Every chapter rebuilds its timeline on
   entry, so going back and forth replays the show cleanly. */
(() => {
  gsap.registerPlugin(CustomEase, SplitText);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (screen, name) => screen.querySelector(`[data-el="${name}"]`);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  CustomEase.create('flip', 'M0,0 C0.3,0 0.35,1.12 0.62,1.06 0.78,1.02 0.86,1 1,1');
  CustomEase.create('land', 'M0,0 C0.18,0.6 0.3,1.06 0.55,1.02 0.75,0.995 0.88,1 1,1');
  CustomEase.create('stamp', 'M0,0 C0.5,0 0.72,0.3 1,1');

  const root = document.documentElement;
  const stage = $('#stage');
  const screens = $$('.screen');
  const segs = $$('#progress b');
  const flash = $('#flash');
  const spot = $('.spot');
  const beam = $('.beam');
  let scale = 1;

  /* ── Fit the 390×844 stage into the window ─────────────────── */
  function fit() {
    if (innerWidth <= 520) scale = 1;
    else scale = Math.min((innerHeight - 72) / 844, (innerWidth - 48) / 390, 1.15);
    root.style.setProperty('--s', scale);
    fx.resize();
  }

  /* Stage-space point for an element (for aiming confetti). */
  function pt(node, ax = 0.5, ay = 0.5) {
    const r = node.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const k = s.width / stage.clientWidth;
    return { x: (r.left + r.width * ax - s.left) / k, y: (r.top + r.height * ay - s.top) / k };
  }

  /* ── Confetti & gold dust (canvas) ─────────────────────────── */
  const fx = (() => {
    const c = $('#fx'), ctx = c.getContext('2d');
    const GOLD = ['#F7D88A', '#E8B23A', '#E8B23A', '#C9962E', '#FFF1C4'];
    const ACCENT = ['#F07830', '#3B6FC4', '#34A96A', '#8A6BB0', '#23A5A5'];
    let W = 390, H = 844, k = 1, camX = 0, camT = 0, t = 0;
    const parts = [];
    const dust = [];

    function resize() {
      W = stage.clientWidth; H = stage.clientHeight;
      k = (devicePixelRatio || 1) * scale;
      c.width = Math.round(W * k); c.height = Math.round(H * k);
    }

    // Seeded from the static confetti in the Paper artboards, then padded
    // with finer dust so the room always has something catching the light.
    function seedDust() {
      const design = [
        [44, 120, '#E8B23A', 8, 'sq'], [W - 59, 180, '#F07830', 7, 'sq'], [70, 250, '#3B6FC4', 6, 'sq'],
        [200, 150, '#34A96A', 5, 'sq'], [W - 67, 300, '#8A6BB0', 7, 'sq'], [50, 340, '#E8B23A', 6, 'dot'],
        [150, 210, '#23A5A5', 5, 'dot'], [W - 125, 280, '#E8B23A', 5, 'sq'],
      ];
      design.forEach(([x, y, color, size, shape]) => dust.push(mkDust(x, y, color, size, shape, 1)));
      for (let i = 0; i < 26; i++) dust.push(mkDust(rand(0, W), rand(0, H), pick(GOLD), rand(1.2, 2.6), 'dot', rand(0.25, 0.7)));
    }
    function mkDust(x, y, color, size, shape, depth) {
      return { x, y, color, size, shape, depth, rot: rand(0, 6.28), vr: rand(-0.4, 0.4), ph: rand(0, 6.28),
        f: rand(0.2, 0.5), amp: rand(4, 12), vy: rand(3, 9) * depth, tw: rand(0.6, 1.6) };
    }

    function spawn(o) {
      if (reduce) return;
      const { x, y, count = 80, angle = -90, spread = 60, speed = [7, 15], colors = GOLD.concat(ACCENT), gravity = 0.24, drag = 0.972, life = [90, 160] } = o;
      for (let i = 0; i < count; i++) {
        const a = (angle + rand(-spread, spread)) * Math.PI / 180, v = rand(speed[0], speed[1]);
        const shape = Math.random() < 0.18 ? 'streamer' : Math.random() < 0.3 ? 'dot' : 'rect';
        const color = pick(colors);
        parts.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: gravity * rand(0.8, 1.2), drag,
          w: shape === 'streamer' ? 2.2 : rand(5, 9), h: shape === 'streamer' ? rand(10, 16) : rand(3, 5),
          rot: rand(0, 6.28), vr: rand(-0.25, 0.25), tilt: rand(0, 6.28), vt: rand(0.08, 0.22),
          wob: rand(0, 6.28), vw: rand(0.05, 0.12), shape, color, foil: GOLD.includes(color),
          life: rand(life[0], life[1]), age: 0,
        });
      }
    }
    const burst = (x, y, o = {}) => spawn({ x, y, angle: -90, spread: 180, speed: [3, 11], gravity: 0.16, ...o });
    const cannons = (o = {}) => {
      spawn({ x: -10, y: H * 0.78, angle: -62, spread: 16, speed: [13, 22], count: 70, ...o });
      spawn({ x: W + 10, y: H * 0.78, angle: -118, spread: 16, speed: [13, 22], count: 70, ...o });
    };
    const rain = (n = 90, colors) => {
      if (reduce) return;
      for (let i = 0; i < n; i++) {
        const delay = rand(0, 1.6);
        gsap.delayedCall(delay, () => spawn({ x: rand(0, W), y: -12, count: 1, angle: 90, spread: 20, speed: [0.5, 2],
          gravity: 0.05, drag: 0.99, life: [260, 380], colors: colors || GOLD }));
      }
    };
    const pan = (dir) => { camT += dir * 36; };

    function drawPiece(p, a) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const flipY = Math.cos(p.tilt);
      ctx.scale(1, flipY);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.shape === 'dot') { ctx.beginPath(); ctx.arc(0, 0, p.w * 0.42, 0, 6.283); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      if (p.foil) { // specular glint as the foil turns toward the light
        const g = Math.max(0, Math.sin(p.tilt * 2)) ** 3;
        if (g > 0.05) { ctx.globalAlpha = a * g * 0.9; ctx.fillStyle = '#FFF8E4';
          if (p.shape === 'dot') { ctx.beginPath(); ctx.arc(0, 0, p.w * 0.42, 0, 6.283); ctx.fill(); }
          else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      }
      ctx.restore();
    }

    function tick(time, dtMs) {
      const dt = Math.min(dtMs, 50) / 16.667;
      t += dtMs / 1000;
      camX += (camT - camX) * 0.04 * dt;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, W, H);

      for (const d of dust) {
        d.y -= d.vy * dtMs / 1000;
        if (d.y < -10) { d.y = H + 10; d.x = rand(0, W); }
        d.rot += d.vr * dtMs / 1000;
        let x = d.x + Math.sin(t * d.f + d.ph) * d.amp + camX * d.depth;
        x = ((x % (W + 20)) + W + 20) % (W + 20) - 10;
        const a = d.shape === 'dot' && d.size < 3 ? 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * d.tw + d.ph)) : 0.9;
        ctx.save(); ctx.translate(x, d.y); ctx.rotate(d.rot); ctx.globalAlpha = a; ctx.fillStyle = d.color;
        if (d.shape === 'dot') { ctx.beginPath(); ctx.arc(0, 0, d.size / 2, 0, 6.283); ctx.fill(); }
        else { const r = Math.min(2, d.size / 3); roundRect(-d.size / 2, -d.size / 2, d.size, d.size, r); ctx.fill(); }
        ctx.restore();
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        p.vx *= Math.pow(p.drag, dt); p.vy = p.vy * Math.pow(p.drag, dt) + p.g * dt;
        p.wob += p.vw * dt;
        p.x += (p.vx + Math.sin(p.wob) * 0.6) * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt; p.tilt += p.vt * dt;
        const fade = clamp((p.life - p.age) / 30, 0, 1);
        if (fade <= 0 || p.y > H + 30) { parts.splice(i, 1); continue; }
        drawPiece(p, fade);
      }
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }

    return { resize, seedDust, burst, spawn, cannons, rain, pan, start: () => gsap.ticker.add(tick) };
  })();

  /* ── Foil helpers ──────────────────────────────────────────── */
  // A split foil word keeps one continuous gradient: each glyph paints the
  // parent-sized gradient offset by its own position inside the parent.
  function foilMetrics() {
    $$('.foil').forEach((f) => {
      f.style.setProperty('--w', f.offsetWidth + 'px');
      f.style.setProperty('--h', f.offsetHeight + 'px');
      $$('.ch', f).forEach((ch) => {
        let x = 0, y = 0, n = ch;
        while (n && n !== f) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
        ch.style.setProperty('--ox', x + 'px');
        ch.style.setProperty('--oy', y + 'px');
      });
    });
  }
  function shine(f, dur = 1.2) {
    const w = f.offsetWidth;
    return gsap.fromTo(f, { '--sx': -w * 1.05 + 'px' }, { '--sx': w * 1.05 + 'px', duration: dur, ease: 'power2.inOut' });
  }
  function shineLoop(f, every = 4, first = 0) {
    return gsap.timeline({ repeat: -1, repeatDelay: every, delay: first }).add(shine(f));
  }

  /* ── Counters ──────────────────────────────────────────────── */
  function countUp(node, dur = 1.6, ease = 'power3.out') {
    const target = +node.dataset.count, suffix = node.dataset.suffix || '';
    const o = { v: 0 };
    node.textContent = '0' + suffix;
    return gsap.to(o, { v: target, duration: dur, ease,
      onUpdate: () => { node.textContent = Math.round(o.v).toLocaleString('en-US') + suffix; } });
  }

  /* ── Odometer for the big "412" ────────────────────────────── */
  function buildOdometer(box) {
    const val = box.dataset.value;
    const reels = document.createElement('div');
    reels.className = 'reels';
    reels.setAttribute('aria-hidden', 'true');
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    box.appendChild(probe);
    [...val].forEach((d, i) => {
      probe.textContent = d;
      const reel = document.createElement('span');
      reel.className = 'reel';
      reel.style.width = probe.getBoundingClientRect().width / (stage.getBoundingClientRect().width / stage.clientWidth) + 'px';
      const strip = document.createElement('span');
      strip.className = 'strip';
      const loops = 2 + (val.length - 1 - i);
      for (let l = 0; l <= loops; l++) for (let n = 0; n < 10; n++) {
        const s = document.createElement('span'); s.textContent = n; strip.appendChild(s);
      }
      strip.dataset.target = loops * 10 + +d;
      reel.appendChild(strip);
      reels.appendChild(reel);
    });
    probe.remove();
    const final = document.createElement('div');
    final.className = 'final foil';
    final.textContent = val;
    box.append(reels, final);
  }

  /* ── Split text once fonts are in ──────────────────────────── */
  const S = {};
  function splitAll() {
    const [cover, numbers, top, worlds, persona] = screens;
    S.year = SplitText.create(el(cover, 'year'), { type: 'chars', charsClass: 'ch' });
    S.coverTitle = SplitText.create(el(cover, 'title'), { type: 'words', wordsClass: 'w' });
    S.numHead = SplitText.create(el(numbers, 'headline'), { type: 'lines', mask: 'lines', linesClass: 'ln' });
    S.duneTitle = SplitText.create(el(top, 'title'), { type: 'words,chars', charsClass: 'c', wordsClass: 'w' });
    S.worldsHead = SplitText.create(el(worlds, 'headline'), { type: 'lines', mask: 'lines', linesClass: 'ln' });
    S.persona = SplitText.create(el(persona, 'persona'), { type: 'words,chars', charsClass: 'ch', wordsClass: 'w' });
    S.personaBody = SplitText.create(el(persona, 'body'), { type: 'words', wordsClass: 'w' });
    el(cover, 'year').classList.add('is-split');
    el(persona, 'persona').classList.add('is-split');
  }

  /* ── Atmosphere per chapter ────────────────────────────────── */
  const ATM = [
    { beam: 0.95, spot: 0.9, y: -70, x: 0, s: 1.0 },
    { beam: 0.45, spot: 0.7, y: -110, x: -70, s: 0.9 },
    { beam: 1.0, spot: 1.0, y: -80, x: 0, s: 0.85 },
    { beam: 0.35, spot: 0.5, y: 60, x: -40, s: 1.15 },
    { beam: 1.0, spot: 1.0, y: -20, x: 0, s: 1.25 },
    { beam: 0.75, spot: 0.85, y: -120, x: 0, s: 1.0 },
  ];
  function atmosphere(i) {
    const a = ATM[i];
    gsap.to(beam, { opacity: a.beam, duration: 1.6, ease: 'power2.inOut' });
    gsap.to(spot, { opacity: a.spot, x: a.x, y: a.y, scale: a.s, duration: 1.8, ease: 'power3.inOut' });
  }

  function flashAt(peak = 1, hold = 0.12) {
    if (reduce) return gsap.timeline();
    return gsap.timeline()
      .to(flash, { opacity: peak, duration: 0.18, ease: 'power2.out' })
      .to(flash, { opacity: 0, duration: 1.1, ease: 'power2.out' }, `+=${hold}`);
  }

  function shake(node, amt = 6) {
    if (reduce) return gsap.timeline();
    return gsap.fromTo(node, { x: 0, y: 0 }, {
      keyframes: { x: [0, -amt, amt * 0.8, -amt * 0.5, amt * 0.25, 0], y: [0, amt * 0.4, -amt * 0.3, amt * 0.2, 0, 0] },
      duration: 0.42, ease: 'none', clearProps: 'x,y',
    });
  }

  function nudgeLoop(screen) {
    const arrow = $('.nudge svg', screen);
    if (!arrow) return null;
    return gsap.to(arrow, { y: 5, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.5 });
  }

  /* ── Chapters ──────────────────────────────────────────────── */
  let live = []; // looping tweens owned by the active chapter
  const keep = (a) => { if (a && !reduce) live.push(a); return a; };

  const chapters = [
    // 00 · Cover — the curtain rises
    (s) => {
      const year = el(s, 'year'), cta = el(s, 'cta');
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from(el(s, 'presents'), { opacity: 0, letterSpacing: '0.9em', duration: 2.0 }, 0.25)
        .from(S.year.chars, { yPercent: 115, opacity: 0, rotateX: -75, filter: 'blur(14px)', transformPerspective: 600,
          transformOrigin: '50% 100%', duration: 1.5, stagger: 0.1 }, 0.5)
        .add(shine(year, 1.4), 1.45)
        .from(S.coverTitle.words, { y: 26, opacity: 0, filter: 'blur(6px)', duration: 1.1, stagger: 0.07 }, 1.2)
        .from(el(s, 'lede'), { y: 16, opacity: 0, duration: 1.1 }, 1.5)
        .from(cta, { y: 36, scale: 0.86, opacity: 0, duration: 1.4, ease: 'elastic.out(1,0.7)' }, 1.75)
        .from(el(s, 'hint'), { opacity: 0, duration: 0.9 }, 2.1)
        .add(() => {
          keep(shineLoop(year, 4.5, 1.5));
          keep(gsap.timeline({ repeat: -1, repeatDelay: 2.6 })
            .call(() => { cta.classList.remove('shine'); void cta.offsetWidth; cta.classList.add('shine'); })
            .to(cta, { scale: 1.035, duration: 0.35, ease: 'sine.out', yoyo: true, repeat: 1 }, 0));
        }, 2.6);
      return tl;
    },

    // 01 · The Numbers — odometer spin, land, sparkle
    (s) => {
      const big = el(s, 'big'), reels = $('.reels', big), final = $('.final', big);
      const strips = $$('.strip', big);
      const lineH = strips[0].firstChild.getBoundingClientRect().height / (stage.getBoundingClientRect().width / stage.clientWidth);
      const counters = $$('[data-count]', s);
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from(el(s, 'eyebrow'), { opacity: 0, x: -14, duration: 0.9 }, 0.1)
        .from(reels, { opacity: 0, y: 30, duration: 0.8 }, 0.15)
        .fromTo(reels, { filter: 'blur(3px)' }, { filter: 'blur(0px)', duration: 1.8, ease: 'power2.in' }, 0.2);
      strips.forEach((st, i) => {
        tl.fromTo(st, { y: 0 }, { y: -st.dataset.target * lineH, duration: 1.7 + i * 0.35, ease: 'land' }, 0.2);
      });
      const landAt = 0.2 + 1.7 + (strips.length - 1) * 0.35 - 0.12;
      tl.to(final, { opacity: 1, duration: 0.35, ease: 'power1.out' }, landAt)
        .to(reels, { opacity: 0, duration: 0.35, ease: 'power1.out' }, landAt)
        .fromTo(big, { scale: 1 }, { scale: 1.045, transformOrigin: '0% 80%', duration: 0.16, ease: 'power2.out', yoyo: true, repeat: 1 }, landAt)
        .add(shine(final, 1.1), landAt + 0.05)
        .from(S.numHead.lines, { yPercent: 105, duration: 1.1, stagger: 0.12 }, 0.75)
        .from(el(s, 'lede'), { y: 14, opacity: 0, duration: 1 }, 1.05)
        .from($$('.stat', s), { y: 34, opacity: 0, scale: 0.94, duration: 1.2, stagger: 0.09 }, 1.25);
      counters.forEach((c, i) => tl.add(countUp(c, 1.7), 1.35 + i * 0.09));
      tl.from($('.footer', s), { opacity: 0, y: 10, duration: 0.8 }, 2.3)
        .add(() => { keep(nudgeLoop(s)); keep(shineLoop(final, 5)); }, 3);
      return tl;
    },

    // 02 · Your #1 — face-down card, drumroll, flip, stamp
    (s) => {
      const poster = el(s, 'poster'), wrap = el(s, 'posterWrap'), glow = el(s, 'glow'), glare = el(s, 'glare');
      const ten = el(s, 'ten'), content = $('.content', s);
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from(el(s, 'eyebrow'), { opacity: 0, y: -10, duration: 0.9 }, 0.1)
        // opacity lives on the wrapper: on .poster it would flatten preserve-3d
        .fromTo(poster, { rotateY: 180, y: 90, scale: 0.78 }, { rotateY: 180, y: 0, scale: 1, duration: 1.2 }, 0.2)
        .fromTo(wrap, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power1.out' }, 0.2)
        // drumroll: the card hovers and shivers before the reveal
        .to(poster, { keyframes: { rotateZ: [0, -2.2, 2, -1.6, 1.2, 0], y: [0, -8, -8, -8, -8, 0] }, duration: 0.8, ease: 'sine.inOut' }, 1.05)
        .fromTo(glow, { opacity: 0, scale: 0.5 }, { opacity: 0.35, scale: 0.8, duration: 0.8, ease: 'sine.inOut' }, 1.05)
        .to(poster, { rotateY: 0, duration: 1.15, ease: 'flip' }, 1.85)
        .to(poster, { scale: 1.1, duration: 0.5, ease: 'power2.out', yoyo: true, repeat: 1 }, 1.85)
        .add(flashAt(0.55, 0.05), 2.12)
        .to(glow, { opacity: 1, scale: 1, duration: 1.4 }, 2.15)
        .fromTo(glare, { opacity: 0, '--gx': '-10%', '--gy': '0%' }, { opacity: 0.9, '--gx': '110%', '--gy': '100%', duration: 1.1, ease: 'power2.inOut' }, 2.25)
        .to(glare, { opacity: 0, duration: 0.5 }, 3.2)
        .from(S.duneTitle.chars, { yPercent: 60, opacity: 0, filter: 'blur(6px)', duration: 0.9, stagger: 0.022 }, 2.55)
        .from(el(s, 'sub'), { opacity: 0, y: 8, duration: 0.8 }, 2.85)
        .fromTo(ten, { scale: 3.2, opacity: 0, filter: 'blur(10px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.42, ease: 'stamp' }, 3.1)
        .add(shake(content, 5), 3.52)
        .add(shine(ten, 1), 3.6)
        .from(el(s, 'of'), { x: -12, opacity: 0, duration: 0.8 }, 3.58)
        .from(el(s, 'note'), { opacity: 0, y: 6, duration: 0.8 }, 3.75)
        .from($('.footer', s), { opacity: 0, y: 10, duration: 0.8 }, 4.1)
        .add(() => {
          keep(gsap.to(wrap, { y: -5, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
          keep(gsap.to(glow, { scale: 1.08, opacity: 0.8, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
          keep(shineLoop(ten, 5));
          keep(nudgeLoop(s));
        }, 4.2);
      return tl;
    },

    // 03 · Your Worlds — racing bars, the winner glints
    (s) => {
      const rows = $$('.bar-row', s);
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from(el(s, 'eyebrow'), { opacity: 0, x: -14, duration: 0.9 }, 0.1)
        .from(S.worldsHead.lines, { yPercent: 108, duration: 1.2, stagger: 0.13 }, 0.2)
        .from(el(s, 'lede'), { y: 12, opacity: 0, duration: 1 }, 0.6)
        .from(rows, { x: -16, opacity: 0, duration: 0.9, stagger: 0.07 }, 0.8);
      rows.forEach((r, i) => {
        const bar = $('.bf', r), n = $('.bn', r);
        tl.fromTo(bar, { width: '0%' }, { width: bar.dataset.w + '%', duration: 1.6, ease: 'expo.out' }, 1.0 + i * 0.09)
          .add(countUp(n, 1.6, 'expo.out'), 1.0 + i * 0.09);
      });
      const win = rows[0];
      tl.add(() => {
        win.classList.remove('glint'); void win.offsetWidth; win.classList.add('glint');
      }, 2.3)
        .fromTo($('.bl', win), { color: '#FFFFFF' }, { color: '#F07830', duration: 0.3, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 2.3)
        .fromTo(win, { scale: 1 }, { scale: 1.03, transformOrigin: '0% 50%', duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' }, 2.3)
        .from($('.footer', s), { opacity: 0, y: 10, duration: 0.8 }, 2.6)
        .add(() => keep(nudgeLoop(s)), 3);
      return tl;
    },

    // 04 · Your Persona — the emotional peak
    (s) => {
      const orbit = el(s, 'orbit'), rings = $$('.ring', orbit), moons = $('.moons', orbit), core = $('.core', orbit);
      const rays = el(s, 'rays'), persona = el(s, 'persona');
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from(el(s, 'eyebrow'), { opacity: 0, y: -10, duration: 0.9 }, 0.1);
      rings.forEach((r, i) => {
        const len = 2 * Math.PI * +r.getAttribute('r');
        tl.fromTo(r, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0.25 + i * 0.16);
      });
      tl.fromTo(core, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 1, ease: 'back.out(3)' }, 0.9)
        .from($$('circle', moons), { scale: 0, transformOrigin: '50% 50%', duration: 0.8, stagger: 0.08, ease: 'back.out(3)' }, 1.15)
        .from(el(s, 'were'), { opacity: 0, y: 10, letterSpacing: '0.12em', duration: 1.3 }, 1.4)
        // the beat before the name
        .fromTo(rays, { opacity: 0, scale: 0.4, rotate: -20 }, { opacity: 1, scale: 1, rotate: 0, duration: 2.2, ease: 'power3.out' }, 2.35)
        .add(flashAt(0.4, 0.05), 2.4)
        .from(S.persona.chars, { opacity: 0, yPercent: 70, rotateX: -85, filter: 'blur(10px)', transformPerspective: 500,
          transformOrigin: '50% 100%', duration: 1.2, stagger: 0.04 }, 2.4)
        // confetti is reserved for two moments: this reveal and the finale
        .add(() => { fx.cannons({ count: 45 }); }, 2.6)
        .add(shine(persona, 1.5), 3.25)
        .from(S.personaBody.words, { opacity: 0, y: 10, filter: 'blur(4px)', duration: 0.9, stagger: 0.022 }, 3.3)
        .from($('.footer', s), { opacity: 0, y: 10, duration: 0.8 }, 4.1)
        .add(() => {
          keep(gsap.to(moons, { rotation: 360, transformOrigin: '50% 50%', duration: 22, ease: 'none', repeat: -1 }));
          keep(gsap.to(core, { scale: 1.18, transformOrigin: '50% 50%', duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
          keep(gsap.to(rays, { rotate: 360, duration: 90, ease: 'none', repeat: -1 }));
          keep(shineLoop(persona, 4.5));
          keep(nudgeLoop(s));
        }, 1.9);
      return tl;
    },

    // 05 · Wrapped — the card flies in from the dark
    (s) => {
      const card = el(s, 'card'), holo = el(s, 'holo'), cta = el(s, 'cta'), wrap = el(s, 'cardWrap');
      const counters = $$('[data-count]', card);
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from(el(s, 'eyebrow'), { opacity: 0, y: -10, duration: 0.9 }, 0.1)
        .fromTo(card, { z: -700, rotateX: 58, rotateZ: -12, y: 140, opacity: 0, transformPerspective: 1100 },
          { z: 0, rotateX: 0, rotateZ: 0, y: 0, opacity: 1, duration: 1.8, ease: 'expo.out' }, 0.2)
        .from(['c1', 'c2', 'c3', 'c4'].map((n) => el(s, n)), { y: 14, opacity: 0, duration: 1, stagger: 0.1 }, 0.65)
        .fromTo(holo, { opacity: 0, '--hx': '-60%' }, { opacity: 1, '--hx': '60%', duration: 1.4, ease: 'power2.inOut' }, 1.1)
        .to(holo, { opacity: 0, duration: 0.6 }, 2.3)
        .add(() => { fx.rain(45); }, 0.95)
        .from($$('.share', s), { y: 18, scale: 0.6, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'back.out(2.2)' }, 1.35)
        .from(cta, { y: 40, opacity: 0, duration: 1.1 }, 1.55)
        .from(el(s, 'hint'), { opacity: 0, duration: 0.8 }, 1.85);
      counters.forEach((c, i) => tl.add(countUp(c, 1.5), 0.9 + i * 0.08));
      tl.add(shine($('.card-persona', card), 1.3), 1.4)
        .add(() => {
          keep(gsap.to(wrap, { y: -6, rotateZ: 0.6, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
          keep(gsap.timeline({ repeat: -1, repeatDelay: 3 })
            .call(() => { cta.classList.remove('shine'); void cta.offsetWidth; cta.classList.add('shine'); }));
          keep(shineLoop($('.card-persona', card), 5));
        }, 2.4);
      return tl;
    },
  ];

  /* ── Leaving a chapter ─────────────────────────────────────── */
  function leave(s, from, to) {
    const dir = to > from ? 1 : -1;
    if (reduce) return gsap.to(s, { autoAlpha: 0, duration: 0.25 });
    if (from === 0 && to === 1) { // zoom through the numeral
      const tl = gsap.timeline();
      tl.to(el(s, 'year'), { scale: 5.5, opacity: 0, filter: 'blur(16px)', duration: 0.95, ease: 'power3.in' }, 0)
        .to([el(s, 'presents'), el(s, 'title'), el(s, 'lede'), $('.footer', s)], { opacity: 0, y: -18, duration: 0.4, ease: 'power2.in', stagger: 0.03 }, 0)
        .add(flashAt(0.9, 0.05), 0.62)
        .set(s, { autoAlpha: 0 });
      return tl;
    }
    return gsap.to(s, { autoAlpha: 0, y: -26 * dir, scale: 0.97, filter: 'blur(8px)', duration: 0.45, ease: 'power2.in' });
  }

  /* ── Progress segments ─────────────────────────────────────── */
  function progress(i) {
    segs.forEach((b, j) => {
      if (j < i) gsap.to(b, { scaleX: 1, duration: 0.4, ease: 'power2.out' });
      else if (j === i) gsap.fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power3.inOut', delay: 0.2 });
      else gsap.to(b, { scaleX: 0, duration: 0.35, ease: 'power2.in' });
    });
  }

  /* ── Navigation ────────────────────────────────────────────── */
  const RESET = 'opacity,visibility,transform,filter,letterSpacing,color,strokeDasharray,strokeDashoffset,x,y,scale,rotate,rotation';
  let cur = -1, master = null, enterTl = null;
  const chapterBtns = $$('#chapterList button');

  function go(i) {
    if (prelude.on) prelude.dismiss();
    i = clamp(i, 0, screens.length - 1);
    if (i === cur) return;
    const from = cur;
    cur = i;
    master && master.progress(1);
    enterTl && enterTl.kill();
    live.forEach((a) => a.kill()); live = [];

    const out = from >= 0 ? screens[from] : null, inn = screens[i];
    chapterBtns.forEach((b) => b.removeAttribute('aria-current'));
    chapterBtns[i].setAttribute('aria-current', 'step');
    history.replaceState(null, '', i ? '#' + i : location.pathname + location.search);
    progress(i);
    atmosphere(i);
    if (from >= 0) fx.pan(i > from ? -1 : 1);

    master = gsap.timeline();
    if (out) master.add(leave(out, from, i));
    master.add(() => {
      if (out) { out.classList.remove('is-active'); out.setAttribute('aria-hidden', 'true'); }
      gsap.set([inn, ...$$('*', inn)], { clearProps: RESET });
      inn.classList.add('is-active');
      inn.removeAttribute('aria-hidden');
      enterTl = chapters[i](inn);
      if (reduce) enterTl.progress(1);
    }, out ? (from === 0 && i === 1 ? 0.78 : 0.3) : 0);
  }
  const next = () => go(cur + 1);
  const prev = () => go(cur - 1);

  // Tap left third = back, elsewhere = forward; swipe in either axis.
  let down = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) { down = null; return; }
    down = { x: e.clientX, y: e.clientY };
  });
  stage.addEventListener('pointerup', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    down = null;
    if (prelude.on) return prelude.open();
    if (Math.hypot(dx, dy) > 36) {
      if (Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
      else (dy < 0 ? next : prev)();
      return;
    }
    const r = stage.getBoundingClientRect();
    ((e.clientX - r.left) / r.width < 0.3 ? prev : next)();
  });

  let wheelLock = 0;
  addEventListener('wheel', (e) => {
    const now = performance.now();
    if (now < wheelLock || Math.abs(e.deltaY) < 24) return;
    wheelLock = now + 1100;
    if (prelude.on) { if (e.deltaY > 0) prelude.open(); return; }
    (e.deltaY > 0 ? next : prev)();
  }, { passive: true });

  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (prelude.on && ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); prelude.open(); return; }
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(k)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(k)) { e.preventDefault(); prev(); }
    else if (k === 'r' || k === 'R' || k === 'Home') prelude.show();
    else if (k === 'End') go(5);
    else if (/^[1-6]$/.test(k)) go(+k - 1);
  });

  /* Pointer tilt for the poster and the share card. */
  const tilt = {
    poster: null, card: null,
    init() {
      const pw = el(screens[2], 'posterWrap'), cw = el(screens[5], 'cardWrap');
      this.poster = { rx: gsap.quickTo(pw, 'rotationX', { duration: 0.8, ease: 'power3' }), ry: gsap.quickTo(pw, 'rotationY', { duration: 0.8, ease: 'power3' }), el: pw };
      this.card = { rx: gsap.quickTo(cw, 'rotationX', { duration: 0.8, ease: 'power3' }), ry: gsap.quickTo(cw, 'rotationY', { duration: 0.8, ease: 'power3' }), el: cw };
      gsap.set([pw, cw], { transformPerspective: 900 });
      const holo = el(screens[5], 'holo'), glare = el(screens[2], 'glare');
      stage.addEventListener('pointermove', (e) => {
        if (reduce || (cur !== 2 && cur !== 5)) return;
        const r = stage.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = ((e.clientY - r.top) / r.height) * 2 - 1;
        const t = cur === 2 ? this.poster : this.card;
        t.rx(-ny * 12); t.ry(nx * 14);
        if (cur === 5 && enterTl && enterTl.progress() === 1) gsap.to(holo, { opacity: 0.75, '--hx': nx * 45 + '%', duration: 0.6, overwrite: 'auto' });
        if (cur === 2 && enterTl && enterTl.progress() === 1) gsap.to(glare, { opacity: 0.55, '--gx': (nx + 1) * 50 + '%', '--gy': (ny + 1) * 50 + '%', duration: 0.6, overwrite: 'auto' });
      });
      stage.addEventListener('pointerleave', () => {
        [this.poster, this.card].forEach((t) => { t.rx(0); t.ry(0); });
        gsap.to([holo, glare], { opacity: 0, duration: 0.8 });
      });
    },
  };

  /* ── Toast & actions ───────────────────────────────────────── */
  const toastEl = $('#toast');
  let toastTl;
  function toast(msg) {
    toastEl.textContent = msg;
    toastTl && toastTl.kill();
    toastTl = gsap.timeline()
      .fromTo(toastEl, { opacity: 0, y: 20, xPercent: -50, x: 0 }, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(2)' })
      .to(toastEl, { opacity: 0, y: 10, duration: 0.4, ease: 'power2.in' }, '+=1.8');
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(location.href); toast('Link copied'); }
    catch { toast('Copy failed — long-press the address bar'); }
  }
  function pop(btn) {
    const sq = $('.sq', btn) || btn;
    gsap.fromTo(sq, { scale: 0.88 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1.2,0.4)' });
  }

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-action], [data-go]');
    if (!b) return;
    if (b.dataset.go) return go(+b.dataset.go);
    switch (b.dataset.action) {
      case 'next': next(); break;
      case 'open': prelude.open(); break;
      case 'restart': prelude.show(); break;
      case 'share':
        pop(b);
        if (navigator.share) {
          try { await navigator.share({ title: 'My 2025 on Decisio', text: 'This year, I was The Midnight Cinephile.', url: location.href }); } catch { /* dismissed */ }
        } else copyLink();
        break;
      case 'copy': pop(b); copyLink(); break;
      case 'share-stories': pop(b); toast('Prototype · would open Instagram Stories'); break;
      case 'share-tiktok': pop(b); toast('Prototype · would open TikTok'); break;
      case 'share-messages': pop(b); toast('Prototype · would open Messages'); break;
      case 'wallpaper': toast('Prototype · 9:16 wallpaper saved'); break;
    }
  });

  /* ── Prelude · the invitation ──────────────────────────────── */
  // Before the show: a sealed envelope. Breaking the seal opens the flap,
  // lifts out the invitation, brings the house lights up and hands off to
  // the Cover. No confetti here; this moment is light, wax and paper.
  let beamSway = null;
  function startSway() {
    beamSway && beamSway.kill();
    if (reduce) return;
    beamSway = gsap.fromTo(beam, { rotation: -6 }, { rotation: 6, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  const prelude = (() => {
    const root = $('#prelude');
    const E = (n) => el(root, n);
    const tiltEl = E('envTilt'), scene = E('envScene'), back = E('envBack'), front = E('envFront'), flap = E('envFlap');
    const card = E('invite'), title = E('invTitle'), seal = E('seal'), ring = E('sealRing'), pulse = E('sealPulse');
    const [halfL, halfR] = $$('.seal-half', root);
    const words = [E('plEyebrow'), E('plFor'), E('plHint')];
    const chrome = [$('#progress'), $('.topbar')];
    const rx = gsap.quickTo(tiltEl, 'rotationX', { duration: 0.9, ease: 'power3' });
    const ry = gsap.quickTo(tiltEl, 'rotationY', { duration: 0.9, ease: 'power3' });
    gsap.set(tiltEl, { transformPerspective: 900 });
    let state = 'off', tl = null, loops = [];

    const stopLoops = () => { loops.forEach((a) => a.kill()); loops = []; };

    function show() {
      master && master.progress(1);
      enterTl && enterTl.kill();
      live.forEach((a) => a.kill()); live = [];
      const replay = cur >= 0;
      if (replay) {
        const s = screens[cur];
        gsap.to(s, { autoAlpha: 0, scale: 0.97, filter: 'blur(8px)', duration: 0.45, ease: 'power2.in',
          onComplete: () => { s.classList.remove('is-active'); s.setAttribute('aria-hidden', 'true'); gsap.set(s, { clearProps: RESET }); } });
      }
      cur = -1;
      chapterBtns.forEach((b) => b.removeAttribute('aria-current'));
      history.replaceState(null, '', location.pathname + location.search);
      segs.forEach((b) => gsap.to(b, { scaleX: 0, duration: 0.35, ease: 'power2.in' }));
      gsap.to(chrome, { autoAlpha: 0, duration: replay ? 0.4 : 0 });
      // House lights down: kill the beam, leave a low glow behind the envelope.
      beamSway && beamSway.kill();
      gsap.to(beam, { opacity: 0, duration: 1 });
      gsap.to(spot, { opacity: 0.6, x: 0, y: 20, scale: 0.62, duration: 1.4, ease: 'power3.inOut' });

      tl && tl.kill(); stopLoops();
      gsap.set([root, ...$$('*', root)], { clearProps: RESET + ',zIndex,rotationX,scaleX,scaleY' });
      flap.classList.remove('is-open');
      seal.classList.remove('cracked');
      gsap.set(root, { autoAlpha: 1 });
      state = 'idle';
      tl = arrive(replay ? 0.45 : 0.15);
      if (reduce) tl.progress(1);
    }

    function arrive(delay) {
      const t = gsap.timeline({ defaults: { ease: 'expo.out' }, delay });
      t.from(words[0], { opacity: 0, letterSpacing: '0.9em', duration: 2 }, 0.2)
        .from(words[1], { opacity: 0, y: 8, duration: 1.2 }, 0.6)
        .fromTo(scene, { y: 170, rotationX: 44, rotationZ: -8, opacity: 0, transformPerspective: 900 },
          { y: 0, rotationX: 0, rotationZ: 0, opacity: 1, duration: 1.8 }, 0.35)
        // the seal stamps down
        .fromTo(seal, { scale: 1.9, opacity: 0, rotation: -25 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.42, ease: 'stamp' }, 1.3)
        .to(seal, { scaleX: 1.07, scaleY: 0.93, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' }, 1.72)
        .to(scene, { y: 3, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' }, 1.72)
        .fromTo(ring, { scale: 0.6, opacity: 0.7 }, { scale: 2.1, opacity: 0, duration: 0.9, immediateRender: false }, 1.72)
        .from(words[2], { opacity: 0, y: 8, duration: 1 }, 2.1)
        .add(() => {
          if (reduce) return;
          loops.push(gsap.to(scene, { y: -5, rotationZ: 0.7, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
          loops.push(gsap.fromTo(pulse, { scale: 1, opacity: 0.7 }, { scale: 1.75, opacity: 0, duration: 1.8, ease: 'power2.out', repeat: -1, repeatDelay: 0.6 }));
          loops.push(gsap.to(words[2], { opacity: 0.55, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
        }, 2.4);
      return t;
    }

    function open() {
      if (state === 'opening') { tl && tl.timeScale(2.5); return; } // impatient tap: fast-forward
      if (state !== 'idle') return;
      state = 'opening';
      tl && tl.progress(1).kill();
      stopLoops();
      rx(0); ry(0);
      if (reduce) {
        gsap.to(root, { autoAlpha: 0, duration: 0.4, onComplete: handoff });
        return;
      }
      tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.to(words, { opacity: 0, y: -6, duration: 0.4, ease: 'power2.in', stagger: 0.04 }, 0)
        .to(scene, { y: 0, rotationZ: 0, duration: 0.3, ease: 'power2.out' }, 0)
        .to(pulse, { opacity: 0, duration: 0.15 }, 0)
        // press… and crack
        .to(seal, { scale: 0.88, duration: 0.12, ease: 'power2.out' }, 0)
        .call(() => seal.classList.add('cracked'), null, 0.14)
        .to(seal, { scale: 1, duration: 0.2, ease: 'power2.out' }, 0.14)
        .add(flashAt(0.28, 0), 0.14)
        .fromTo(ring, { scale: 0.5, opacity: 0.95 }, { scale: 4.4, opacity: 0, duration: 1.2 }, 0.14)
        .to(scene, { keyframes: { y: [0, 6, -2, 0] }, duration: 0.36, ease: 'none' }, 0.14)
        .to(halfL, { x: -40, rotation: -34, duration: 1.05, ease: 'power2.out' }, 0.16)
        .to(halfL, { y: 330, duration: 1.05, ease: 'power2.in' }, 0.16)
        .to(halfR, { x: 42, rotation: 27, duration: 1.05, ease: 'power2.out' }, 0.2)
        .to(halfR, { y: 350, duration: 1.05, ease: 'power2.in' }, 0.2)
        .to([halfL, halfR], { opacity: 0, duration: 0.3, ease: 'none' }, 0.9)
        // the flap swings open to reveal the gold liner
        .fromTo(flap, { rotationX: 0, transformPerspective: 700 }, { rotationX: 180, duration: 0.9, ease: 'power2.inOut',
          onUpdate: () => flap.classList.toggle('is-open', gsap.getProperty(flap, 'rotationX') > 90) }, 0.34)
        // the invitation slides out…
        .to(card, { y: -208, duration: 1.1, ease: 'power3.inOut' }, 1.05)
        .set(card, { zIndex: 6 }, 2.15)
        // …the envelope falls away and the card settles centre stage
        .to([back, front, flap], { y: 380, opacity: 0, duration: 1.1, ease: 'power3.in' }, 1.95)
        .to(card, { y: -4, scale: 1.18, duration: 1.25, ease: 'power3.inOut' }, 2.15)
        .to(spot, { opacity: 0.95, y: 0, scale: 0.95, duration: 1.6, ease: 'sine.inOut' }, 2.2)
        .add(shine(title, 1.4), 2.85)
        // house lights up: the beam swings onto the stage
        .to(beam, { opacity: 0.95, duration: 1.4, ease: 'power2.out' }, 3.95)
        .fromTo(beam, { rotation: -34 }, { rotation: -6, duration: 1.9, ease: 'power3.out' }, 3.95)
        // zoom through the invitation into the show
        .to(card, { scale: 5.2, opacity: 0, filter: 'blur(16px)', duration: 0.95, ease: 'power3.in' }, 4.35)
        .add(flashAt(0.9, 0.05), 4.82)
        .add(handoff, 5.05);
    }

    function handoff() {
      state = 'off';
      gsap.set(root, { autoAlpha: 0 });
      gsap.to(chrome, { autoAlpha: 1, duration: 0.9, ease: 'power2.out' });
      startSway();
      go(0);
    }

    // A chapter was picked while the invitation was up: skip straight there.
    function dismiss() {
      tl && tl.kill(); stopLoops();
      state = 'off';
      gsap.to(root, { autoAlpha: 0, duration: 0.3 });
      gsap.to(chrome, { autoAlpha: 1, duration: 0.5 });
      gsap.to(beam, { opacity: ATM[0].beam, duration: 0.8 });
      startSway();
    }

    stage.addEventListener('pointermove', (e) => {
      if (reduce || state !== 'idle') return;
      const r = stage.getBoundingClientRect();
      rx(-(((e.clientY - r.top) / r.height) * 2 - 1) * 9);
      ry((((e.clientX - r.left) / r.width) * 2 - 1) * 11);
    });
    stage.addEventListener('pointerleave', () => { rx(0); ry(0); });

    return {
      show, open, dismiss,
      get on() { return state !== 'off'; },
      seek: (t) => { tl && tl.seek(t, false).pause(); },
    };
  })();

  /* ── Boot ──────────────────────────────────────────────────── */
  async function boot() {
    try {
      await Promise.all([
        document.fonts.load('900 118px "Inter Tight"'), document.fonts.load('800 30px "Inter Tight"'),
        document.fonts.load('400 15px "Inter"'), document.fonts.load('600 12px "JetBrains Mono"'),
      ]);
      await document.fonts.ready;
    } catch { /* fall back to system fonts */ }
    fit();
    screens.forEach((s) => s.setAttribute('aria-hidden', 'true'));
    splitAll();
    buildOdometer(el(screens[1], 'big'));
    foilMetrics();
    fx.seedDust();
    fx.start();
    tilt.init();
    // Show whichever poster face points at the viewer. (backface-visibility
    // alone is unreliable in Chrome once the image gets its own layer.)
    const poster = el(screens[2], 'poster');
    const [back, front] = $$('.poster-face', poster);
    gsap.ticker.add(() => {
      if (cur !== 2) return;
      const showBack = Math.cos(gsap.getProperty(poster, 'rotationY') * Math.PI / 180) < 0;
      back.style.visibility = showBack ? 'visible' : 'hidden';
      front.style.visibility = showBack ? 'hidden' : 'visible';
    });
    // Deep links (#0–#5) skip the invitation and go straight to a chapter.
    const hash = parseInt(location.hash.slice(1), 10);
    if (Number.isFinite(hash)) { startSway(); go(clamp(hash, 0, 5)); }
    else prelude.show();
  }
  // Handy for reviewing a beat frame-by-frame from the console:
  //   ceremony.go(2); ceremony.seek(1.9)   ·   ceremony.prelude(); ceremony.open(); ceremony.seekPrelude(2)
  window.ceremony = {
    go, seek: (t) => { enterTl && enterTl.seek(t, false).pause(); }, play: () => { enterTl && enterTl.play(); },
    prelude: () => prelude.show(), open: () => prelude.open(), seekPrelude: (t) => prelude.seek(t),
  };
  addEventListener('resize', () => { fit(); foilMetrics(); });
  boot();
})();
