/* Contact page. MOCKUP: submitting does not send anything; it shows the confirmation naming the chosen region's rep. */

Tesoro.init().then(({ catalog }) => {
  const { esc, tel } = Tesoro;
  const s = catalog.studio;
  const g = catalog.general;
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address.join(', '))}`;

  document.querySelector('[data-studio]').innerHTML = `
    <h2>${esc(s.name)}</h2>
    <address>${s.address.map(esc).join('<br>')}</address>
    <p>Tel <a href="${tel(s.tel)}">${esc(s.tel)}</a></p>
    <p><a href="mailto:${s.email}">${esc(s.email)}</a></p>
    <a class="link-arrow" href="${map}" rel="noopener" target="_blank">Directions<span class="visually-hidden"> (opens in a new tab)</span></a>`;

  document.querySelector('[data-reps]').innerHTML = catalog.reps.map(r => `
    <div class="rep">
      <h3>${esc(r.region)}</h3>
      <p class="rep__name">${esc(r.name)}</p>
      <p><a href="${tel(r.phone)}">${esc(r.phone)}</a></p>
      <p><a href="mailto:${r.email}">${esc(r.email)}</a></p>
    </div>`).join('');

  document.querySelector('[data-general]').innerHTML = `
    <strong>${esc(g.label)}</strong>
    <span>${esc(g.role)}</span>
    <a href="mailto:${g.email}">${esc(g.email)}</a>
    <a href="${tel(g.phone)}">${esc(g.phone)}</a>`;

  const form = document.querySelector('[data-form]');
  const region = form.querySelector('#c-region');
  region.insertAdjacentHTML('beforeend', Tesoro.regionOptions(catalog));
  Tesoro.bindRegion(catalog, region, form.querySelector('[data-rep-card]'));

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const r = catalog.reps[region.value];
    document.querySelector('[data-form-wrap]').hidden = true;
    const sent = document.querySelector('[data-sent]');
    sent.hidden = false;
    sent.innerHTML = `<h2>Thank you, ${esc(form.name.value.split(' ')[0])}.</h2>
      <p>Your message has gone to ${esc(r.name)}, our ${esc(r.region)} representative, who will be in touch shortly.</p>
      <p>Prefer to talk now? Call <a href="${tel(r.phone)}">${esc(r.phone)}</a>.</p>`;
    sent.focus();
  });
});
