Tesoro.init().then(({ products, catalog, byHandle }) => {
  const { esc, img, swatch, finishLabel, tel } = Tesoro;

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
