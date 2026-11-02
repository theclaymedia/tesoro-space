/* Shared: data loading, header/footer, quote dialog.
   Header and footer are rendered here so every mockup page stays in sync;
   in the Shopify theme they become sections/header.liquid and footer.liquid. */

const Tesoro = (() => {
  let cache;

  async function load() {
    if (cache) return cache;
    const [shop, catalog] = await Promise.all([
      fetch('data/shopify-products.json').then(r => r.json()),
      fetch('data/catalog.json').then(r => r.json()),
    ]);
    // sample-sets is the free sample kit, not furniture. (Don't filter on vendor: the Lux Lounge Sofa is vendor TESOROMOCK.)
    const products = shop.products.filter(p => p.handle !== 'sample-sets');
    cache = { products, catalog, byHandle: Object.fromEntries(products.map(p => [p.handle, p])) };
    return cache;
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = (handle, n = 1) => `assets/products/${handle}/${String(n).padStart(2, '0')}.jpg`;
  const finish = (catalog, value) => catalog.finishes[value] || { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-'), group: '' };
  const finishLabel = (catalog, value) => finish(catalog, value).label || value;
  const swatch = (catalog, value) => `assets/swatches/${finish(catalog, value).slug}.jpg`;
  const optionLabel = (catalog, name) => catalog.optionLabels[name] || name;
  const tel = s => 'tel:+1' + s.replace(/\D/g, '');

  /* Region picker shared by the quote dialog, samples and contact forms */
  const regionOptions = catalog => catalog.reps.map((r, i) => `<option value="${i}">${esc(r.region)}</option>`).join('');
  const repCard = r => `<p>Your representative: <strong>${esc(r.name)}</strong></p>
        <p><a href="${tel(r.phone)}">${esc(r.phone)}</a> · <a href="mailto:${r.email}">${esc(r.email)}</a></p>`;
  function bindRegion(catalog, select, card) {
    select.addEventListener('change', () => {
      const r = catalog.reps[select.value];
      card.hidden = !r;
      if (r) card.innerHTML = repCard(r);
    });
  }

  /* Collection membership, as the live store's smart collections define it */
  const inCollection = (p, handle) => {
    const t = p.product_type.toLowerCase();
    if (handle === 'sets') return /\bsets?\b/.test(t);
    if (handle === 'seating') return /chair|sofa|couch|chaise|stool|sectional/.test(t) && !/\bsets?\b/.test(t);
    if (handle === 'tables') return /table|bar|bbq/.test(t) && !/\bsets?\b/.test(t);
    return true;
  };

  const NAV = [
    ['Seating', 'collection.html?c=seating'],
    ['Tables', 'collection.html?c=tables'],
    ['Sets', 'collection.html?c=sets'],
    ['Samples', 'samples.html'],
    ['About', 'about.html'],
    ['Contact', 'contact.html'],
  ];

  function renderHeader() {
    const el = document.querySelector('[data-site-header]');
    if (!el) return;
    const here = location.pathname.split('/').pop() + location.search;
    const links = NAV.map(([t, h]) => `<a href="${h}"${here === h ? ' aria-current="page"' : ''}>${t}</a>`).join('');
    el.outerHTML = `
      <a class="skip-link" href="#content">Skip to content</a>
      <header class="site-header">
        <div class="container site-header__inner">
          <div>
            <button class="menu-toggle" aria-expanded="false" aria-controls="mobile-nav" aria-label="Menu"><span></span><span></span></button>
            <nav class="nav" aria-label="Primary">${links}</nav>
          </div>
          <a class="site-header__logo" href="index.html" aria-label="Tesoro, home"><img src="assets/site/logo-ink.png" alt="Tesoro" width="800" height="156"></a>
          <div class="header-actions">
            <a class="hide-sm" href="contact.html">Find a rep</a>
            <a class="btn" href="#inquire" data-open-quote>Inquire</a>
          </div>
        </div>
        <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile">${links}</nav>
      </header>`;
    const header = document.querySelector('.site-header');
    const toggle = header.querySelector('.menu-toggle');
    const mobile = header.querySelector('.mobile-nav');
    toggle.addEventListener('click', () => {
      const open = mobile.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
    });
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function renderFooter(catalog) {
    const el = document.querySelector('[data-site-footer]');
    if (!el) return;
    const s = catalog.studio;
    el.outerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="site-footer__grid">
            <div>
              <img src="assets/site/logo-ink.png" alt="Tesoro" width="800" height="156" loading="lazy">
              <p>Every piece is built by hand, one by one, at our studio in Los Angeles.</p>
            </div>
            <div>
              <h2>Collection</h2>
              <ul>${NAV.slice(0, 4).map(([t, h]) => `<li><a href="${h}">${t}</a></li>`).join('')}<li><a href="collection.html?c=all">All pieces</a></li></ul>
            </div>
            <div>
              <h2>${esc(s.name)}</h2>
              <p>${s.address.map(esc).join('<br>')}</p>
              <p><a href="${tel(s.tel)}">${esc(s.tel)}</a></p>
              <p><a href="mailto:${s.email}">${esc(s.email)}</a></p>
            </div>
            <div>
              <h2>Follow</h2>
              <ul>${Object.entries(catalog.social).map(([n, u]) => `<li><a href="${u}" rel="noopener">${n}</a></li>`).join('')}</ul>
            </div>
          </div>
          <div class="site-footer__base">
            <span>© ${new Date().getFullYear()} Tesoro Space. Made in Los Angeles.</span>
            <span><a href="about.html">About</a> · <a href="contact.html">Contact</a></span>
          </div>
        </div>
      </footer>`;
  }

  /* ---------- quote dialog ----------
     getConfig() returns [{label, value}] for the current selection (product page),
     or nothing for a general inquiry. MOCKUP: submitting does not send anything. */
  let getConfig = () => null;
  let productTitle = '';

  function setQuoteContext(title, fn) { productTitle = title; getConfig = fn; }

  function renderQuote(catalog) {
    const d = document.createElement('dialog');
    d.className = 'quote';
    d.setAttribute('aria-labelledby', 'quote-title');
    const regions = regionOptions(catalog);
    d.innerHTML = `
      <div class="quote__inner">
        <div class="quote__head">
          <div><p class="eyebrow">Request a quote</p><h2 id="quote-title">Let’s talk about your space</h2></div>
          <button class="quote__close" type="button" aria-label="Close">×</button>
        </div>
        <form class="quote__form" novalidate>
          <div class="summary" data-quote-summary hidden></div>
          <div class="field">
            <label for="q-region">Your region</label>
            <select id="q-region" name="region" required>
              <option value="">Select the nearest region</option>${regions}
            </select>
          </div>
          <div class="rep-card" data-rep-card hidden></div>
          <div class="field-row">
            <div class="field"><label for="q-name">Name</label><input id="q-name" name="name" autocomplete="name" required></div>
            <div class="field"><label for="q-phone">Phone</label><input id="q-phone" name="phone" type="tel" autocomplete="tel"></div>
          </div>
          <div class="field"><label for="q-email">Email</label><input id="q-email" name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label for="q-msg">Project details</label><textarea id="q-msg" name="message" placeholder="Quantities, timeline, location, or anything else we should know"></textarea></div>
          <button class="btn btn--block" type="submit">Send inquiry</button>
        </form>
        <div class="quote__sent" hidden></div>
      </div>`;
    document.body.append(d);

    const form = d.querySelector('form');
    const region = d.querySelector('#q-region');
    const repCard = d.querySelector('[data-rep-card]');
    const summary = d.querySelector('[data-quote-summary]');
    const sent = d.querySelector('.quote__sent');

    bindRegion(catalog, region, repCard);

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const r = catalog.reps[region.value];
      form.hidden = true;
      sent.hidden = false;
      sent.innerHTML = `<h3>Thank you, ${esc(form.name.value.split(' ')[0])}.</h3>
        <p>Your inquiry has gone to ${esc(r.name)}, our ${esc(r.region)} representative, who will be in touch shortly.</p>
        <p>Prefer to talk now? Call <a href="${tel(r.phone)}">${esc(r.phone)}</a>.</p>
        <button class="btn btn--ghost" type="button" data-close>Close</button>`;
      sent.querySelector('[data-close]').addEventListener('click', () => d.close());
    });

    const close = () => d.close();
    d.querySelector('.quote__close').addEventListener('click', close);
    d.addEventListener('click', e => { if (e.target === d) close(); });

    document.addEventListener('click', e => {
      const t = e.target.closest('[data-open-quote]');
      if (!t) return;
      e.preventDefault();
      const cfg = getConfig();
      summary.hidden = !cfg;
      if (cfg) summary.innerHTML = `<h2>${esc(productTitle)}</h2><dl>${cfg.map(c => `<dt>${esc(c.label)}</dt><dd>${esc(c.value)}</dd>`).join('')}</dl>`;
      form.hidden = false; sent.hidden = true;
      d.showModal();
    });
  }

  /* Product card: no price, just name, option groups and the four metal finishes */
  function productCard(p, catalog) {
    const metals = (p.options.find(o => o.name === 'Metal Color') || { values: [] }).values;
    const groups = p.options.map(o => optionLabel(catalog, o.name)).join(' · ');
    const second = p.images.length > 1 ? `<img src="${img(p.handle, 2)}" alt="" loading="lazy" width="1600" height="1600">` : '';
    return `<a class="product-card" href="product.html?p=${p.handle}">
      <div class="product-card__media">
        <img src="${img(p.handle)}" alt="${esc(p.title)}" loading="lazy" width="1600" height="1600">${second}
      </div>
      <div class="product-card__body">
        <h3 class="product-card__title">${esc(p.title)}</h3>
        <div class="product-card__meta"><span>${esc(groups)}</span>
          <span class="dots" aria-label="${metals.length} metal finishes">${metals.map(v => `<span style="background-image:url(${swatch(catalog, v)})"></span>`).join('')}</span>
        </div>
      </div>
    </a>`;
  }

  async function init() {
    renderHeader();
    const data = await load();
    renderFooter(data.catalog);
    renderQuote(data.catalog);
    return data;
  }

  return { init, load, productCard, esc, img, finish, finishLabel, swatch, optionLabel, inCollection, setQuoteContext, tel, regionOptions, bindRegion };
})();
