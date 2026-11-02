/* Collection page: collection.html?c=seating|tables|sets|all
   In Shopify this is templates/collection.json. Membership comes from Tesoro.inCollection(),
   which mirrors the live store's smart collections (product type + tags). */

Tesoro.init().then(({ products, catalog }) => {
  const { esc } = Tesoro;
  const all = catalog.allCollection;
  const tabs = [...catalog.collections, all];
  const wanted = new URLSearchParams(location.search).get('c');
  const current = tabs.find(c => c.handle === wanted) || all;
  const pieces = products.filter(p => Tesoro.inCollection(p, current.handle));

  document.title = `${current.title} | Tesoro`;
  document.querySelector('[data-title]').textContent = current.title;
  document.querySelector('[data-blurb]').textContent = current.blurb;

  document.querySelector('[data-filters]').innerHTML = [all, ...catalog.collections].map(c =>
    `<a href="collection.html?c=${c.handle}"${c.handle === current.handle ? ' aria-current="page"' : ''}>${esc(c.handle === 'all' ? 'All' : c.title)}</a>`).join('');
  document.querySelector('[data-count]').textContent = `${pieces.length} ${pieces.length === 1 ? 'piece' : 'pieces'}`;

  document.querySelector('[data-grid]').innerHTML = pieces.map(p => Tesoro.productCard(p, catalog)).join('');
});
