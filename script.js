/* =========================================================
   CURSOR DOT
========================================================= */
const cursorDot = document.getElementById('cursorDot');
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && cursorDot) {
  window.addEventListener('mousemove', (e) => {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => { cursorDot.style.width = '28px'; cursorDot.style.height = '28px'; });
    el.addEventListener('mouseleave', () => { cursorDot.style.width = '8px'; cursorDot.style.height = '8px'; });
  });
}

/* =========================================================
   NAV: hide on scroll down, show on scroll up + blur bg
========================================================= */
const nav = document.getElementById('nav');
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 40);
  if (y > lastY && y > 140) nav.classList.add('is-hidden');
  else nav.classList.remove('is-hidden');
  lastY = y;
}, { passive: true });

/* Mobile menu */
const burger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger) {
  burger.addEventListener('click', () => mobileMenu.classList.toggle('is-open'));
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('is-open')));
}

/* =========================================================
   SCROLL REVEAL
========================================================= */
const revealTargets = document.querySelectorAll(
  '.about-portrait, .about-copy, .timeline-item, .project-row, .stack-item, .cert-card, .learning-item, .section-head'
);
revealTargets.forEach(el => el.setAttribute('data-reveal', ''));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

revealTargets.forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
  revealObserver.observe(el);
});

/* Timeline active dot tracking */
const timelineItems = document.querySelectorAll('.timeline-item');
const timelineObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('is-active');
  });
}, { threshold: 0.5 });
timelineItems.forEach(item => timelineObserver.observe(item));

/* =========================================================
   COUNT-UP METRICS
========================================================= */
const metricNums = document.querySelectorAll('.metric-num');
const metricObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.count, 10) || 0;
    let current = 0;
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      current = Math.floor(progress * target);
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
    metricObserver.unobserve(el);
  });
}, { threshold: 0.6 });
metricNums.forEach(el => metricObserver.observe(el));

/* =========================================================
   PROJECT ROW TILT (subtle 3D tilt on hover)
========================================================= */
document.querySelectorAll('[data-tilt]').forEach(card => {
  const visual = card.querySelector('.project-visual');
  if (!visual || window.matchMedia('(hover: hover)').matches === false) return;
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    visual.style.transform = `perspective(800px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg)`;
  });
  card.addEventListener('mouseleave', () => { visual.style.transform = ''; });
});

/* =========================================================
   THREE.JS — HERO: 3D data-point network sphere
   A rotating cloud of points connected by faint lines —
   a literal visualization of "statistics / data" as a
   living 3D object. Reacts gently to pointer position.
========================================================= */
(function heroScene() {
  const canvas = document.getElementById('webgl');
  if (!canvas || typeof THREE === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 9;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const group = new THREE.Group();
  scene.add(group);

  // --- Build a point cloud on a sphere (data points) ---
  const POINT_COUNT = 260;
  const radius = 4.6;
  const positions = new Float32Array(POINT_COUNT * 3);
  const phis = [];
  for (let i = 0; i < POINT_COUNT; i++) {
    // fibonacci sphere distribution
    const y = 1 - (i / (POINT_COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    positions[i * 3] = x * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = z * radius;
    phis.push(theta);
  }

  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const pointsMat = new THREE.PointsMaterial({
    color: 0x5cffb1,
    size: 0.06,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true
  });
  const pointCloud = new THREE.Points(pointsGeo, pointsMat);
  group.add(pointCloud);

  // --- Connect nearby points with thin lines (network look) ---
  const lineVerts = [];
  const maxDist = 1.55;
  for (let i = 0; i < POINT_COUNT; i++) {
    const xi = positions[i * 3], yi = positions[i * 3 + 1], zi = positions[i * 3 + 2];
    let connections = 0;
    for (let j = i + 1; j < POINT_COUNT && connections < 3; j++) {
      const xj = positions[j * 3], yj = positions[j * 3 + 1], zj = positions[j * 3 + 2];
      const d = Math.hypot(xi - xj, yi - yj, zi - zj);
      if (d < maxDist) {
        lineVerts.push(xi, yi, zi, xj, yj, zj);
        connections++;
      }
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVerts), 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0x2f8c66, transparent: true, opacity: 0.28 });
  const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
  group.add(lineMesh);

  // --- Inner wireframe icosahedron (the "core" structure) ---
  const coreGeo = new THREE.IcosahedronGeometry(2.1, 1);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x6e8bff, wireframe: true, transparent: true, opacity: 0.22 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // --- Scattered accent points (amber) for depth ---
  const accentCount = 40;
  const accentPos = new Float32Array(accentCount * 3);
  for (let i = 0; i < accentCount; i++) {
    const r = 6 + Math.random() * 2.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    accentPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    accentPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    accentPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const accentGeo = new THREE.BufferGeometry();
  accentGeo.setAttribute('position', new THREE.BufferAttribute(accentPos, 3));
  const accentMat = new THREE.PointsMaterial({ color: 0xffb454, size: 0.045, transparent: true, opacity: 0.5 });
  const accentPoints = new THREE.Points(accentGeo, accentMat);
  scene.add(accentPoints);

  // Pointer parallax
  let targetRotX = 0, targetRotY = 0;
  window.addEventListener('pointermove', (e) => {
    const nx = (e.clientX / window.innerWidth) - 0.5;
    const ny = (e.clientY / window.innerHeight) - 0.5;
    targetRotY = nx * 0.5;
    targetRotX = ny * 0.3;
  });

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  let raf;
  const clock = new THREE.Clock();

  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (!reduceMotion) {
      group.rotation.y = t * 0.07 + targetRotY;
      group.rotation.x = targetRotX * 0.6;
      core.rotation.y = -t * 0.05;
      core.rotation.x = t * 0.03;
      accentPoints.rotation.y = t * 0.02;
      pointsMat.size = 0.06 + Math.sin(t * 1.4) * 0.008;
    }
    renderer.render(scene, camera);
  }
  animate();

  // Pause rendering when hero is off-screen (perf)
  const heroEl = document.getElementById('hero');
  const ioHero = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { if (!raf) animate(); }
      else { cancelAnimationFrame(raf); raf = null; }
    });
  }, { threshold: 0.05 });
  ioHero.observe(heroEl);
})();

/* =========================================================
   THREE.JS — CONTACT: slow ambient particle drift
========================================================= */
(function contactScene() {
  const canvas = document.getElementById('webgl-contact');
  if (!canvas || typeof THREE === 'undefined') return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const count = 140;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0x5cffb1, size: 0.045, transparent: true, opacity: 0.45 });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  let raf;
  const clock = new THREE.Clock();
  function animate() {
    raf = requestAnimationFrame(animate);
    if (!reduceMotion) {
      const t = clock.getElapsedTime();
      points.rotation.y = t * 0.025;
      points.rotation.x = Math.sin(t * 0.1) * 0.05;
    }
    renderer.render(scene, camera);
  }
  animate();

  const contactEl = document.querySelector('.contact');
  const ioContact = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { if (!raf) animate(); }
      else { cancelAnimationFrame(raf); raf = null; }
    });
  }, { threshold: 0.05 });
  ioContact.observe(contactEl);
})();
