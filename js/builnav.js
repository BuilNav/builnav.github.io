/* BuilNav project page: behaviour. Hero scroll effect and topbar follow the Dy-craft.github.io page; peek carousel, scene
   selector and scroll-scale video follow ideas of the CHORD page. Newly written, no third-party code, no analytics. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---- theme ---- */
  var root = document.documentElement;
  var saved = store('bn-theme');
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  var tb = $('#themeBtn');
  if (tb) tb.addEventListener('click', function () {
    var cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next); store('bn-theme', next);
  });

  /* ---- hero scroll effect, topbar, progress bar ---- */
  var film = $('#film'), stage = $('#filmStage'), topbar = $('#topbar'), prog = $('#progress');
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY, vh = window.innerHeight;
      var span = Math.max(1, film.offsetHeight - vh);
      var p = Math.min(1, Math.max(0, y / span));
      stage.style.setProperty('--p', p.toFixed(3));
      var t = Math.min(1, Math.max(0, (p - 0.12) / 0.4));
      stage.style.setProperty('--t', t.toFixed(3));
      film.classList.toggle('is-titled', t > 0.01);
      topbar.classList.toggle('on', y > film.offsetHeight - vh * 1.02);
      var h = document.documentElement.scrollHeight - vh;
      if (prog) prog.style.width = (h > 0 ? (y / h * 100) : 0).toFixed(1) + '%';
      scaleVideos();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  var cue = $('#filmCue');
  if (cue) cue.addEventListener('click', function () { var a = $('#abstract'); if (a) a.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---- active section in the topbar ---- */
  var links = $$('.topbar-links a');
  var secs = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* ---- reveal on scroll ---- */
  if ('IntersectionObserver' in window && !reduce) {
    var rv = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { rv.observe(el); });
  } else { $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }

  /* ---- media: missing files show a labelled slot; videos load lazily and play only while visible ---- */
  function markMissing(el) { var m = el.closest('.media'); if (m) m.classList.add('is-missing'); }
  $$('.media img').forEach(function (im) {
    im.addEventListener('error', function () { markMissing(im); });
    if (im.complete && im.naturalWidth === 0 && im.getAttribute('src')) markMissing(im);
  });
  function loadVideo(v) {
    if (v.dataset.loaded) return; v.dataset.loaded = '1';
    $$('source[data-src]', v).forEach(function (s) { s.src = s.getAttribute('data-src'); s.addEventListener('error', function () { markMissing(v); }); });
    v.addEventListener('error', function () { markMissing(v); });
    v.load();
  }
  var vio = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        loadVideo(v);
        if (v.hasAttribute('data-auto') && !reduce && !v.dataset.paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      } else if (v.dataset.loaded && !v.paused) { v.pause(); }
    });
  }, { rootMargin: '200px 0px' }) : null;
  $$('video[data-lazy]').forEach(function (v) { if (vio) vio.observe(v); else loadVideo(v); });
  $$('.playbtn').forEach(function (b) {
    b.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var v = b.parentNode.querySelector('video'); if (!v) return;
      loadVideo(v);
      if (v.paused) { v.dataset.paused = ''; v.play().catch(function () {}); b.setAttribute('aria-label', 'Pause'); }
      else { v.dataset.paused = '1'; v.pause(); b.setAttribute('aria-label', 'Play'); }
    });
  });
  var hero = $('#heroVideo');
  if (hero) {
    hero.addEventListener('error', function () { hero.style.display = 'none'; }, true);
    $$('source', hero).forEach(function (s) { s.addEventListener('error', function () { hero.style.display = 'none'; }); });
    if (reduce) { hero.removeAttribute('autoplay'); hero.pause(); }
  }

  /* ---- scroll-scale video (width grows as it enters the viewport) ---- */
  function scaleVideos() {
    var vh = window.innerHeight;
    $$('.scale-video').forEach(function (el) {
      var r = el.getBoundingClientRect();
      var c = (r.top + r.height / 2) / vh; // 1 = lower edge, 0.5 = centre
      var k = Math.min(1, Math.max(0, 1 - Math.abs(c - 0.5) * 1.6));
      el.style.width = (reduce ? 100 : (74 + 26 * k)) + '%';
    });
  }

  /* ---- generic tabs ---- */
  function tabs(list, panelAttr) {
    var btns = $$('[role=tab]', list);
    function sel(b) {
      btns.forEach(function (x) {
        var on = x === b; x.setAttribute('aria-selected', on ? 'true' : 'false');
        var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
      });
      if (b.dataset.hash) { try { history.replaceState(null, '', '#' + b.dataset.hash); } catch (e) {} }
      animateBars();
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { sel(b); }); });
  }
  $$('.m-tabs, .r-tabs').forEach(function (l) { tabs(l); });

  /* ---- bars ---- */
  function animateBars() {
    $$('.bar > span').forEach(function (s) {
      if (s.offsetParent === null) return;
      requestAnimationFrame(function () { s.style.width = s.getAttribute('data-w') + '%'; });
    });
  }
  if ('IntersectionObserver' in window) {
    var bo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { animateBars(); } }); }, { threshold: 0.15 });
    $$('.bars').forEach(function (b) { bo.observe(b); });
  } else animateBars();

  /* ---- peek carousel (chord style) ---- */
  $$('.carousel').forEach(function (car) {
    var slides = $$('.car-slide', car), dots = $('.car-dots', car), idx = 0, timer = null;
    slides.forEach(function (s, i) {
      var d = document.createElement('button'); d.setAttribute('aria-label', 'Slide ' + (i + 1));
      d.addEventListener('click', function () { go(i); }); dots.appendChild(d);
      s.addEventListener('click', function () { if (s.classList.contains('prev') || s.classList.contains('next')) go(i); });
    });
    function go(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var n = slides.length, rel = (k - idx + n) % n;
        s.classList.toggle('active', rel === 0);
        s.classList.toggle('next', rel === 1);
        s.classList.toggle('prev', rel === n - 1);
        var v = s.querySelector('video'); if (!v) return;
        if (rel === 0) { loadVideo(v); if (!reduce) v.play().catch(function () {}); } else if (v.dataset.loaded) v.pause();
        if (rel === 1 || rel === n - 1) loadVideo(v);
      });
      $$('button', dots).forEach(function (d, k) { d.classList.toggle('active', k === idx); });
    }
    $('.car-btn.p', car).addEventListener('click', function () { go(idx - 1); });
    $('.car-btn.n', car).addEventListener('click', function () { go(idx + 1); });
    go(0);
  });

  /* ---- gallery filter chips ---- */
  var gchips = $('#gChips');
  if (gchips) {
    $$('button', gchips).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', gchips).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var f = b.dataset.f;
        $$('.g-card').forEach(function (c) { c.hidden = !(f === 'all' || c.dataset.cat === f); });
      });
    });
  }

  /* ---- scene selector + comparison grid (chord style) ---- */
  var scn = $('#scenes');
  if (scn) {
    var sbtn = $$('button', scn), cgrids = $$('.cmp-grid[data-scene]'), prompt = $('#cmpPrompt');
    function showScene(b) {
      sbtn.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      cgrids.forEach(function (g) { g.hidden = g.dataset.scene !== b.dataset.scene; });
      if (prompt) prompt.textContent = b.dataset.prompt || '';
      cgrids.forEach(function (g) { if (!g.hidden) $$('video[data-lazy]', g).forEach(function (v) { if (vio) vio.observe(v); else loadVideo(v); }); });
    }
    sbtn.forEach(function (b) { b.addEventListener('click', function () { showScene(b); }); });
    if (sbtn[0]) showScene(sbtn[0]);
  }

  /* ---- lightbox ---- */
  var lb = $('#lb');
  if (lb && lb.showModal) {
    var lbm = $('.lb-media', lb), lbt = $('.lb-title', lb);
    $$('.expand').forEach(function (el) {
      el.addEventListener('click', function () {
        var src = el.dataset.full || el.getAttribute('src'); if (!src) return;
        lbm.innerHTML = '';
        var isV = /\.(mp4|webm)(\?|$)/.test(src), n = document.createElement(isV ? 'video' : 'img');
        if (isV) { n.controls = true; n.autoplay = true; n.loop = true; n.muted = true; n.playsInline = true; }
        n.src = src; n.alt = el.getAttribute('alt') || '';
        lbm.appendChild(n); lbt.textContent = el.dataset.title || el.getAttribute('alt') || '';
        lb.showModal();
      });
    });
    function closeLb() { lb.close(); lbm.innerHTML = ''; }
    $('#lbClose').addEventListener('click', closeLb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    lb.addEventListener('close', function () { lbm.innerHTML = ''; });
  }

  /* ---- bibtex copy ---- */
  var bc = $('#bibCopy');
  if (bc) bc.addEventListener('click', function () {
    var t = $('#bibText').textContent;
    var done = function () { bc.textContent = 'Copied'; setTimeout(function () { bc.textContent = 'Copy'; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, done);
    else { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); done(); }
  });

  /* ---- deep link to a method / result tab ---- */
  var h = location.hash.slice(1);
  if (h) { var tabBtn = $('[role=tab][data-hash="' + h + '"]'); if (tabBtn) tabBtn.click(); }

  onScroll();
})();
