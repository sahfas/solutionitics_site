/* ============================================
   SOLUTIONITICS — Main JavaScript
   ============================================ */

/* --------------------------------------------
   CONFIG

   FORM_ENDPOINT — where the contact form POSTs.
   Paste your form-service endpoint here, e.g.
     Formspree:  https://formspree.io/f/xxxxxxxx
     Web3Forms:  https://api.web3forms.com/submit   (also set FORM_ACCESS_KEY)
     Getform:    https://getform.io/f/xxxxxxxx

   While this is empty the form falls back to opening the visitor's
   email client with their message pre-filled, so no enquiry is lost.
   -------------------------------------------- */
const FORM_ENDPOINT   = '';
const FORM_ACCESS_KEY = '';                       // Web3Forms only
const CONTACT_EMAIL   = 'hello@solutionitics.com';

const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileNav();
  initScrollReveal();
  initCounters();
  initTestimonials();
  initParticles();
  initContactForm();
  initActiveNav();
  initCurrentYear();
});

/* --- Footer copyright year (so it never goes stale) --- */
function initCurrentYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-current-year]').forEach(el => {
    el.textContent = year;
  });
}

/* --- Navbar Scroll Effect --- */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --- Mobile Navigation ---
   Slide-in panel with backdrop, focus trap, Escape to close, and
   scroll lock. The panel is inert while closed so keyboard users
   never tab into off-screen links. */
function initMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');
  const backdrop  = document.querySelector('.nav-backdrop');
  if (!hamburger || !navLinks) return;

  const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea';
  let lastFocused = null;
  let scrollY = 0;

  const isOpen = () => navLinks.classList.contains('open');
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  function setClosedState() {
    // Only trap/hide on mobile — on desktop the links are normal nav.
    if (isMobile() && !isOpen()) navLinks.setAttribute('inert', '');
    else navLinks.removeAttribute('inert');
  }

  function open() {
    lastFocused = document.activeElement;
    scrollY = window.scrollY;
    navLinks.classList.add('open');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close menu');
    navLinks.removeAttribute('inert');
    document.body.classList.add('nav-open');

    // lock the page behind the panel without losing scroll position
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    // Wait for the panel to actually become visible — focus() is ignored
    // while the element is still visibility:hidden from the closed state.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const first = navLinks.querySelector(FOCUSABLE);
      if (first) first.focus({ preventScroll: true });
    }));
    document.addEventListener('keydown', onKeydown);
  }

  function close({ restoreFocus = true } = {}) {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('nav-open');

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);

    document.removeEventListener('keydown', onKeydown);
    setClosedState();
    if (restoreFocus && lastFocused) lastFocused.focus({ preventScroll: true });
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;

    const items = [...navLinks.querySelectorAll(FOCUSABLE)]
      .filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last  = items[items.length - 1];

    // keep focus inside the open panel
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  hamburger.addEventListener('click', () => (isOpen() ? close() : open()));
  if (backdrop) backdrop.addEventListener('click', () => close());

  // Navigating away: let the link work, just unlock the page first.
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (isOpen()) close({ restoreFocus: false });
    });
  });

  // Crossing the breakpoint while open would leave the page scroll-locked.
  let lastIsMobile = isMobile();
  window.addEventListener('resize', debounce(() => {
    const nowMobile = isMobile();
    if (nowMobile !== lastIsMobile) {
      lastIsMobile = nowMobile;
      if (isOpen()) close({ restoreFocus: false });
      setClosedState();
    }
  }, 150));

  setClosedState();
}

/* --- Scroll Reveal Animation --- */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  // No observer support, or the visitor asked for less motion:
  // show everything immediately rather than leaving a blank page.
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('visible'));
    return;
  }

  // threshold must be 0, not a fraction: a tall element (the Terms and
  // Privacy pages wrap ~3,600px of copy in a single .reveal) can never
  // show 10% of itself in one viewport, so a 0.1 threshold left the whole
  // page blank until the visitor scrolled.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });
  reveals.forEach(el => observer.observe(el));
}

/* --- Animated Counters --- */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const setFinal = el => {
    el.textContent = (el.dataset.count || '') + (el.dataset.suffix || '');
  };

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    counters.forEach(setFinal);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  if (Number.isNaN(target)) return;
  const duration = 2000;
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(target * ease) + suffix;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(update);
}

/* --- Testimonial Slider ---
   Autoplay pauses on hover, focus and tab-hide; supports swipe,
   arrow keys, and announces slide changes to screen readers. */
function initTestimonials() {
  const wrapper = document.querySelector('.testimonials-wrapper');
  const track   = document.querySelector('.testimonial-track');
  const dots    = document.querySelectorAll('.testimonial-dots .dot');
  if (!wrapper || !track || !dots.length) return;

  const slides = track.querySelectorAll('.testimonial-slide');
  let current = 0;
  const total = dots.length;
  let autoplay = null;
  let paused = false;

  function goTo(index) {
    current = ((index % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => {
      const active = i === current;
      d.classList.toggle('active', active);
      d.setAttribute('aria-current', active ? 'true' : 'false');
    });
    slides.forEach((s, i) => s.setAttribute('aria-hidden', i === current ? 'false' : 'true'));
  }

  function start() {
    if (prefersReducedMotion || paused || autoplay) return;
    autoplay = setInterval(() => goTo(current + 1), 6000);
  }
  function stop() {
    clearInterval(autoplay);
    autoplay = null;
  }
  function restart() { stop(); start(); }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); restart(); });
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { goTo(current + 1); restart(); dots[current].focus(); }
      if (e.key === 'ArrowLeft')  { goTo(current - 1); restart(); dots[current].focus(); }
    });
  });

  // pause while the visitor is reading
  ['mouseenter', 'focusin'].forEach(ev =>
    wrapper.addEventListener(ev, () => { paused = true; stop(); }));
  ['mouseleave', 'focusout'].forEach(ev =>
    wrapper.addEventListener(ev, () => { paused = false; start(); }));

  document.addEventListener('visibilitychange', () =>
    document.hidden ? stop() : start());

  // touch swipe
  let startX = 0, startY = 0, swiping = false;
  wrapper.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    swiping = true;
    stop();
  }, { passive: true });

  wrapper.addEventListener('touchend', (e) => {
    if (!swiping) return;
    swiping = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    // ignore mostly-vertical gestures so page scrolling still works
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      goTo(current + (dx < 0 ? 1 : -1));
    }
    start();
  }, { passive: true });

  goTo(0);
  start();
}

/* --- Particle Canvas (Hero) ---
   Skipped entirely for reduced-motion users. Pauses when the hero
   scrolls out of view or the tab is hidden, so it stops burning
   battery on the rest of the page. */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const LINK_DIST = 120;
  const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
  const MAX_PARTICLES = 90;

  let particles = [];
  let w = 0, h = 0, animId = null, running = false;

  function resize() {
    const parent = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = parent.offsetWidth;
    h = parent.offsetHeight;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticles() {
    particles = [];
    // density scaled to area, but hard-capped so big screens stay cheap
    const count = Math.min(Math.floor((w * h) / 18000), MAX_PARTICLES);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.4 + 0.1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 166, 35, ${p.a})`;
      ctx.fill();
    }

    // connections — compare squared distances, only sqrt the ones that link
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq >= LINK_DIST_SQ) continue;
        const dist = Math.sqrt(distSq);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(245, 166, 35, ${0.06 * (1 - dist / LINK_DIST)})`;
        ctx.stroke();
      }
    }
    animId = requestAnimationFrame(draw);
  }

  function start() {
    if (running) return;
    running = true;
    draw();
  }
  function stop() {
    running = false;
    if (animId !== null) cancelAnimationFrame(animId);
    animId = null;
  }

  resize();
  createParticles();
  start();

  window.addEventListener('resize', debounce(() => {
    resize();
    createParticles();
  }, 200));

  // stop drawing once the hero is off-screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      entry.isIntersecting ? start() : stop();
    }, { threshold: 0 }).observe(canvas);
  }

  document.addEventListener('visibilitychange', () =>
    document.hidden ? stop() : start());
}

/* --- Contact Form --- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const msg    = form.querySelector('.form-message');
  const button = form.querySelector('button[type="submit"]');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.setAttribute('novalidate', '');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    const name    = (data.name    || '').trim();
    const email   = (data.email   || '').trim();
    const message = (data.message || '').trim();

    if (!name || !email || !message) {
      showFormMsg(msg, 'Please fill in all required fields.', 'error');
      return;
    }
    if (!emailRe.test(email)) {
      showFormMsg(msg, 'Please enter a valid email address.', 'error');
      return;
    }

    // No endpoint configured yet — hand off to the visitor's mail client
    // rather than pretending the message was delivered.
    if (!FORM_ENDPOINT) {
      const subject = data.subject?.trim() || `Project enquiry from ${name}`;
      const body = [
        `Name: ${name}`,
        `Email: ${email}`,
        data.service ? `Service: ${data.service}` : '',
        data.budget  ? `Budget: ${data.budget}`   : '',
        '',
        message
      ].filter(Boolean).join('\n');

      window.location.href =
        `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

      showFormMsg(msg, `Opening your email app to send this to ${CONTACT_EMAIL}. ` +
                       `If nothing happens, email us directly.`, 'success', 9000);
      return;
    }

    const original = button ? button.innerHTML : '';
    if (button) { button.disabled = true; button.textContent = 'Sending…'; }

    try {
      const payload = FORM_ACCESS_KEY ? { ...data, access_key: FORM_ACCESS_KEY } : data;
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      showFormMsg(msg, "Thank you! Your message has been sent. We'll get back to you within 24 hours.", 'success', 8000);
      form.reset();
    } catch (err) {
      console.error('Contact form submission failed:', err);
      showFormMsg(
        msg,
        `Sorry — we couldn't send that. Please email us directly at ${CONTACT_EMAIL}.`,
        'error',
        10000
      );
    } finally {
      if (button) { button.disabled = false; button.innerHTML = original; }
    }
  });
}

function showFormMsg(el, text, type, timeout = 5000) {
  if (!el) return;
  el.textContent = text;
  el.className = 'form-message ' + type;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.className = 'form-message';
    el.textContent = '';
  }, timeout);
}

/* --- Active Nav Link --- */
function initActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  // .nav-cta also points at contact.html — it's a button, not a section link,
  // so it must never pick up the active underline.
  document.querySelectorAll('.nav-links a:not(.nav-cta)').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === 'index.html' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

/* --- Utils --- */
function debounce(fn, wait) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
