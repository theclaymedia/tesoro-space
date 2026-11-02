/* Samples page. The live store sells a free "sample-sets" product with Metal / Fabric / Stone options.
   MOCKUP: submitting does not send anything; real fulfilment is decided at the Shopify stage.
   Wood (Ipê) is not part of the sample set on the live store, so it is not offered here. */

Tesoro.init().then(({ catalog }) => {
  const { esc, swatch, finishLabel, tel } = Tesoro;
  const groups = [['Metal', 'Metals'], ['Fabric', 'Fabrics'], ['Stone', 'Stones']];

  document.querySelector('[data-picks]').innerHTML = groups.map(([g, title]) => {
    const values = Object.keys(catalog.finishes).filter(v => catalog.finishes[v].group === g);
    return `<fieldset class="pick-group"><legend>${title}</legend><div class="picks">${values.map(v => {
      const id = `pick-${catalog.finishes[v].slug}`;
      return `<div class="pick">
        <input type="checkbox" id="${id}" name="samples" value="${esc(v)}" checked form="samples-form">
        <label for="${id}"><img src="${swatch(catalog, v)}" alt="" width="80" height="80" loading="lazy">${esc(finishLabel(catalog, v))}</label>
      </div>`;
    }).join('')}</div></fieldset>`;
  }).join('');

  const form = document.querySelector('[data-form]');
  form.id = 'samples-form';
  const boxes = () => [...document.querySelectorAll('input[name="samples"]')];
  const error = document.querySelector('[data-error]');
  const setAll = on => { boxes().forEach(b => { b.checked = on; }); error.hidden = on; };
  document.querySelector('[data-select-all]').addEventListener('click', () => setAll(true));
  document.querySelector('[data-select-none]').addEventListener('click', () => setAll(false));
  document.addEventListener('change', e => { if (e.target.name === 'samples') error.hidden = boxes().some(b => b.checked); });

  const region = form.querySelector('#s-region');
  region.insertAdjacentHTML('beforeend', Tesoro.regionOptions(catalog));
  Tesoro.bindRegion(catalog, region, form.querySelector('[data-rep-card]'));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const chosen = boxes().filter(b => b.checked).map(b => finishLabel(catalog, b.value));
    error.hidden = chosen.length > 0;
    if (!chosen.length) { boxes()[0].focus(); return; }
    if (!form.reportValidity()) return;
    const r = catalog.reps[region.value];
    document.querySelector('[data-form-wrap]').hidden = true;
    const sent = document.querySelector('[data-sent]');
    sent.hidden = false;
    sent.innerHTML = `<h2>Thank you, ${esc(form.name.value.split(' ')[0])}.</h2>
      <p>Your request for ${chosen.length} ${chosen.length === 1 ? 'sample' : 'samples'} has gone to ${esc(r.name)}, our ${esc(r.region)} representative.</p>
      <p>${chosen.map(esc).join(', ')}.</p>
      <p>Questions? Call <a href="${tel(r.phone)}">${esc(r.phone)}</a>.</p>`;
    sent.focus();
  });
});
