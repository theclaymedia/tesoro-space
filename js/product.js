/* Product page.
   Finish → image rule (see CLAUDE.md):
   - one option group drives the main image (catalog.imageOption, Metal by default)
   - the live photos were shot in catalog.baseFinish, so that value shows the real gallery
   - any other value shows catalog.finishImages[handle][value] if supplied, else a placeholder
   In Shopify this maps to variant images / metafields on the same keys. */

Tesoro.init().then(({ products, catalog, byHandle }) => {
  const { esc, img, swatch, finish, finishLabel, optionLabel, tel } = Tesoro;
  const handle = new URLSearchParams(location.search).get('p') || 'outdoor-lounge-chair';
  const p = byHandle[handle];
  if (!p) { document.querySelector('[data-title]').textContent = 'Piece not found'; return; }

  const collection = catalog.collections.find(c => Tesoro.inCollection(p, c.handle));
  document.title = `${p.title} | Tesoro`;
  document.querySelector('[data-title]').textContent = p.title;
  document.querySelector('[data-collection-label]').textContent = collection ? collection.title : 'Collection';
  document.querySelector('[data-breadcrumb]').innerHTML = `
    <li><a href="index.html">Home</a></li>
    ${collection ? `<li><a href="collection.html?c=${collection.handle}">${esc(collection.title)}</a></li>` : ''}
    <li aria-current="page">${esc(p.title)}</li>`;
  document.querySelector('[data-call]').href = tel(catalog.studio.tel);

  /* ---------- gallery ---------- */
  const main = document.querySelector('[data-main-image]');
  const thumbs = document.querySelector('[data-thumbs]');
  const note = document.querySelector('[data-gallery-note]');
  const placeholder = document.querySelector('[data-placeholder]');
  let photoIndex = 1;

  function showPhoto(src, alt) {
    if (main.getAttribute('src') === src) return;
    main.classList.add('is-loading');
    main.onload = () => main.classList.remove('is-loading');
    main.src = src;
    main.alt = alt;
  }

  thumbs.innerHTML = p.images.map((_, i) => `
    <button type="button" aria-label="View image ${i + 1} of ${p.images.length}" data-i="${i + 1}">
      <img src="${img(p.handle, i + 1)}" alt="" loading="lazy" width="1600" height="1600">
    </button>`).join('');
  if (p.images.length < 2) thumbs.hidden = true;
  thumbs.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    photoIndex = +b.dataset.i;
    viewingPhotos = true;
    render();
  });

  /* ---------- options ---------- */
  const form = document.querySelector('[data-options]');
  const selected = {};
  p.options.forEach(o => {
    const group = finish(catalog, o.values[0]).group;
    const base = catalog.baseFinish[group];
    selected[o.name] = o.values.includes(base) ? base : o.values[0];
  });

  form.innerHTML = p.options.map((o, oi) => `
    <fieldset class="option">
      <legend>${esc(optionLabel(catalog, o.name))} <output data-label="${oi}"></output></legend>
      <div class="swatches">${o.values.map((v, vi) => {
        const id = `opt-${oi}-${vi}`;
        return `<span class="swatch">
          <input type="radio" id="${id}" name="${esc(o.name)}" value="${esc(v)}"${selected[o.name] === v ? ' checked' : ''}>
          <label for="${id}" title="${esc(finishLabel(catalog, v))}" style="background-image:url(${swatch(catalog, v)})"><span class="visually-hidden">${esc(finishLabel(catalog, v))}</span></label>
        </span>`;
      }).join('')}</div>
    </fieldset>`).join('');

  const driverGroup = catalog.imageOption[p.handle] || catalog.imageOption.default;
  const driver = p.options.find(o => o.values.some(v => finish(catalog, v).group === driverGroup)) || p.options[0];
  let viewingPhotos = false; // true after a thumbnail click: show the photo even if the finish has no image yet

  form.addEventListener('change', e => {
    selected[e.target.name] = e.target.value;
    if (e.target.name === driver.name) viewingPhotos = false;
    render();
  });

  function render() {
    // labels + summary
    p.options.forEach((o, oi) => {
      form.querySelector(`[data-label="${oi}"]`).textContent = finishLabel(catalog, selected[o.name]);
    });
    document.querySelector('[data-summary]').innerHTML = p.options
      .map(o => `<dt>${esc(optionLabel(catalog, o.name))}</dt><dd>${esc(finishLabel(catalog, selected[o.name]))}</dd>`).join('');

    // main image
    const value = selected[driver.name];
    const group = finish(catalog, value).group;
    const base = catalog.baseFinish[group];
    const supplied = (catalog.finishImages[p.handle] || {})[value];
    const photoAlt = `${p.title}, image ${photoIndex}`;

    if (value === base || viewingPhotos) {
      placeholder.hidden = true;
      showPhoto(img(p.handle, photoIndex), photoAlt);
      note.textContent = value === base ? '' : `Photographed in ${finishLabel(catalog, base)}. ${finishLabel(catalog, value)} image to come.`;
    } else if (supplied) {
      placeholder.hidden = true;
      showPhoto(supplied, `${p.title} in ${finishLabel(catalog, value)}`);
      note.textContent = '';
    } else {
      placeholder.hidden = false;
      main.alt = '';
      document.querySelector('[data-placeholder-swatch]').style.backgroundImage = `url(${swatch(catalog, value)})`;
      document.querySelector('[data-placeholder-title]').textContent = `${p.title} in ${finishLabel(catalog, value)}`;
      note.textContent = `Shown as a placeholder. The current photos are in ${finishLabel(catalog, base)}.`;
    }
    thumbs.querySelectorAll('button').forEach(b =>
      b.setAttribute('aria-current', String(placeholder.hidden && +b.dataset.i === photoIndex)));
  }
  render();

  Tesoro.setQuoteContext(p.title, () => p.options.map(o => ({
    label: optionLabel(catalog, o.name),
    value: finishLabel(catalog, selected[o.name]),
  })));

  /* ---------- details (spec text from Shopify body_html, cleaned of inline styling) ---------- */
  const doc = new DOMParser().parseFromString(p.body_html, 'text/html');
  doc.querySelectorAll('[style], [class], [id]').forEach(n => { n.removeAttribute('style'); n.removeAttribute('class'); n.removeAttribute('id'); });
  doc.querySelectorAll('span, font, meta, div').forEach(n => n.replaceWith(...n.childNodes));
  doc.querySelectorAll('h1, h2, h5, h6').forEach(n => { const h = doc.createElement('h3'); h.append(...n.childNodes); n.replaceWith(h); });
  doc.querySelectorAll('p, li, h3, h4').forEach(n => { if (!n.textContent.trim() && !n.querySelector('img')) n.remove(); });
  doc.querySelectorAll('img, script, iframe').forEach(n => n.remove());

  document.querySelector('[data-details]').innerHTML = `
    <details open><summary>Materials &amp; care</summary><div class="details__body">${doc.body.innerHTML}</div></details>
    <details><summary>Dimensions</summary><div class="details__body"><p class="todo">Dimensions to come.</p><p>Your representative can provide drawings and measurements for this piece.</p></div></details>
    <details><summary>Made to order</summary><div class="details__body"><p>Each piece is built by hand at our Los Angeles studio once your finishes are confirmed. Your representative will confirm lead time with your quote.</p></div></details>`;

  /* ---------- related ---------- */
  const related = products.filter(x => x.handle !== p.handle && collection && Tesoro.inCollection(x, collection.handle)).slice(0, 3);
  if (collection) document.querySelector('[data-related-link]').href = `collection.html?c=${collection.handle}`;
  document.querySelector('[data-related]').innerHTML = related.map(x => Tesoro.productCard(x, catalog)).join('');
});
