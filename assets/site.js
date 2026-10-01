// Abstracts remain readable if JavaScript is unavailable.
for (const button of document.querySelectorAll('[data-abstract-toggle]')) {
  const abstract = document.getElementById(button.getAttribute('aria-controls'));
  if (!abstract) continue;
  abstract.hidden = true;
  button.hidden = false;
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => {
    abstract.hidden = !abstract.hidden;
    button.setAttribute('aria-expanded', String(!abstract.hidden));
  });
}
