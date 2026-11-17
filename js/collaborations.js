/* Designer collaborations page. Data: catalog.collaborations (see _collaborations in catalog.json).
   In Shopify the designers become a metaobject and the pieces are normal products tagged "Designer Collection".
   Sample profiles (sample: true) show a small tag so nobody mistakes placeholder copy for a real designer. */

Tesoro.init().then(({ catalog }) => {
  const { esc } = Tesoro;
  const c = catalog.collaborations;

  document.title = 'Designer Collaborations | Tesoro';
  document.querySelector('[data-title]').textContent = c.title;
  document.querySelector('[data-blurb]').textContent = c.blurb;
  document.querySelector('[data-intro]').textContent = c.intro;

  const initials = name => name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  document.querySelector('[data-designers]').innerHTML = c.designers.map((d, i) => `
    <section class="section designer${i % 2 ? ' designer--alt' : ''}" aria-labelledby="${esc(d.handle)}-name">
      <div class="container">
        <div class="designer__head">
          <div class="designer__portrait${d.sample ? ' designer__portrait--sample' : ''}" role="img" aria-label="${esc(d.name)}, portrait to come"><span aria-hidden="true">${d.sample ? 'Portrait to come' : esc(initials(d.name))}</span></div>
          <div class="designer__intro">
            <p class="eyebrow">${esc(d.role)} · ${esc(d.location)}</p>
            <h2 id="${esc(d.handle)}-name">${esc(d.name)}${d.sample ? ' <span class="tag">Sample profile</span>' : ''}</h2>
            <p class="designer__bio">${esc(d.bio)}</p>
          </div>
        </div>
        <h3 class="designer__label">Example pieces</h3>
        <div class="designer__pieces">${d.pieces.map(p => `
          <article class="piece">
            <div class="piece__media" role="img" aria-label="${esc(p.title)}, image to come"><span>Image to come</span></div>
            <h4 class="piece__title">${esc(p.title)}</h4>
            <p class="piece__meta">${esc(p.type)} · ${esc(p.note)}</p>
          </article>`).join('')}
        </div>
      </div>
    </section>`).join('');
});
