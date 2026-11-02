Tesoro.init().then(({ products, catalog, byHandle }) => {
  const { esc, img, swatch, finishLabel, tel } = Tesoro;

  /* ---------- hero: slowly panning product photos ----------
     The track holds the slides twice, so translating it by -50% loops seamlessly.
     Speed is constant (px/s) whatever the screen size; the duration is derived from the track's width.
     Motion can be paused (WCAG 2.2.2) and the choice is remembered; reduced-motion users get a static, scrollable strip. */
  const viewport = document.querySelector('[data-hero-viewport]');
  const track = document.querySelector('[data-hero-track]');
  const pause = document.querySelector('[data-hero-pause]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const PAN_SPEED = 28; // px per second

  const slides = catalog.heroPieces.map(h => byHandle[h]).filter(Boolean);
  const slide = (p, i, copy) => `<a class="hero__slide" href="product.html?p=${p.handle}"${copy ? ' aria-hidden="true" tabindex="-1"' : ''}>
      <img src="${img(p.handle)}" alt="${copy ? '' : esc(p.title)}" width="1600" height="1600"${i < 3 && !copy ? ' fetchpriority="high"' : ' loading="lazy"'}>
      <span class="hero__label" aria-hidden="true">${esc(p.title)}</span></a>`;
  track.innerHTML = slides.map((p, i) => slide(p, i, false)).join('') + slides.map((p, i) => slide(p, i, true)).join('');

  const setDuration = () => {
    const w = track.scrollWidth / 2;
    if (w) track.style.setProperty('--pan-duration', `${(w / PAN_SPEED).toFixed(1)}s`);
  };
  new ResizeObserver(setDuration).observe(track);

  const store = {
    get: () => { try { return localStorage.getItem('tesoro-motion'); } catch { return null; } },
    set: v => { try { localStorage.setItem('tesoro-motion', v); } catch { /* private mode: choice just isn't remembered */ } },
  };
  const setPaused = paused => {
    document.body.classList.toggle('motion-paused', paused);
    pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? 'Play motion' : 'Pause motion';
  };
  setPaused(store.get() === 'paused');
  pause.addEventListener('click', () => {
    const paused = !document.body.classList.contains('motion-paused');
    setPaused(paused);
    store.set(paused ? 'paused' : 'playing');
  });

  const applyReduced = () => {
    pause.hidden = reduceMotion.matches;
    if (reduceMotion.matches) { viewport.tabIndex = 0; viewport.setAttribute('aria-label', 'Selected pieces, scrollable'); }
    else { viewport.removeAttribute('tabindex'); viewport.removeAttribute('aria-label'); }
  };
  applyReduced();
  reduceMotion.addEventListener('change', applyReduced);

  document.querySelector('[data-collections]').innerHTML = catalog.collections.map(c => {
    const count = products.filter(p => Tesoro.inCollection(p, c.handle)).length;
    return `<a class="collection-card" href="collection.html?c=${c.handle}">
      <div class="collection-card__media"><img src="${img(c.cover)}" alt="" loading="lazy" width="1600" height="1600"></div>
      <div class="collection-card__label">${esc(c.title)} <small>${count} pieces</small></div>
    </a>`;
  }).join('');

  document.querySelector('[data-featured]').innerHTML = catalog.featured
    .map(h => byHandle[h]).filter(Boolean)
    .map(p => Tesoro.productCard(p, catalog)).join('');

  const groups = ['Metal', 'Fabric', 'Stone', 'Wood'];
  document.querySelector('[data-materials]').innerHTML = groups.map(g => {
    const values = Object.keys(catalog.finishes).filter(v => catalog.finishes[v].group === g);
    return `<div><h3>${g}</h3><ul>${values.map(v =>
      `<li><img src="${swatch(catalog, v)}" alt="" loading="lazy" width="200" height="200">${esc(finishLabel(catalog, v))}</li>`).join('')}</ul></div>`;
  }).join('');

  document.querySelector('[data-reps]').innerHTML = catalog.reps.map(r => `
    <div class="rep">
      <h3>${esc(r.region)}</h3>
      <p class="rep__name">${esc(r.name)}</p>
      <p><a href="${tel(r.phone)}">${esc(r.phone)}</a></p>
      <p><a href="mailto:${r.email}">${esc(r.email)}</a></p>
    </div>`).join('');
});
