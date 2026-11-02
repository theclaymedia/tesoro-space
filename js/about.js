Tesoro.init().then(({ catalog }) => {
  const s = catalog.studio;
  document.querySelector('[data-studio]').textContent = `${s.name}, ${s.address.join(', ')}.`;
});
