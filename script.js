'use strict';
(() => {
  const $ = (selector) => document.querySelector(selector);
  const figures = window.FIGURES;
  const figureDialog = $('#image-dialog');
  const figureViewport = $('#dialog-figure');
  const zoomButton = $('#zoom-figure');
  let selectedFigure = figures[0];

  // Native links and a small mobile menu keep every section available without a router.
  $('.menu-toggle').addEventListener('click', () => {
    const expanded = $('.menu-toggle').getAttribute('aria-expanded') !== 'true';
    $('.menu-toggle').setAttribute('aria-expanded', String(expanded));
    $('#navigation').classList.toggle('is-open', expanded);
  });
  $('#navigation').querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    $('#navigation').classList.remove('is-open');
    $('.menu-toggle').setAttribute('aria-expanded', 'false');
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && $('#navigation').classList.contains('is-open')) {
      $('#navigation').classList.remove('is-open');
      $('.menu-toggle').setAttribute('aria-expanded', 'false');
      $('.menu-toggle').focus();
    }
  });
  const sectionLinks = document.querySelectorAll('#navigation a, .header-action');
  const navigationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin: '-15% 0px -60% 0px'});
  sectionLinks.forEach((link) => navigationObserver.observe($(link.hash)));

  function paragraphNodes(text) {
    const fragment = document.createDocumentFragment();
    text.split(/\n\n+/).forEach((part) => {
      const p = document.createElement('p');
      part.split('\n').forEach((line, i) => {
        if (i) p.append(document.createElement('br'));
        p.append(document.createTextNode(line));
      });
      fragment.append(p);
    });
    return fragment;
  }
  $('#letter-body').append(paragraphNodes(window.COVER_LETTER));
  $('#print-letter').addEventListener('click', () => window.print());

  function selectFigure(id, updateLocation = false) {
    const figure = figures.find((f) => f.id === id);
    if (!figure) return;
    selectedFigure = figure;
    $('#figure-title').textContent = `${figure.label} · ${figure.title}`;
    $('#figure-image').src = figure.image;
    $('#figure-image').alt = `${figure.label}: ${figure.title}`;
    $('#figure-pdf').href = figure.pdf;
    $('#figure-pdf').textContent = `Open ${figure.format || 'PDF'} ↗`;
    $('#figure-pdf').setAttribute('aria-label', `Open ${figure.label} ${figure.format || 'PDF'}`);
    $('#figure-panel').setAttribute('aria-labelledby', `tab-${figure.id}`);
    $('#figure-legend').replaceChildren(paragraphNodes(figure.legend));
    $('#figure-tabs').querySelectorAll('button').forEach((button) => {
      const active = button.dataset.figure === id;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    if (updateLocation) history.replaceState(null, '', `#${id}`);
  }
  figures.forEach((figure, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'figure-tab';
    button.id = `tab-${figure.id}`;
    button.dataset.figure = figure.id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'figure-panel');
    const label = document.createElement('span');
    label.textContent = figure.label;
    const title = document.createElement('strong');
    title.textContent = figure.short;
    button.append(label, title);
    button.addEventListener('click', () => selectFigure(figure.id, true));
    button.addEventListener('keydown', (event) => {
      let next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % figures.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + figures.length) % figures.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = figures.length - 1;
      else return;
      event.preventDefault();
      selectFigure(figures[next].id, true);
      $(`#tab-${figures[next].id}`).focus();
    });
    $('#figure-tabs').append(button);
  });
  function setFigureZoom(zoomed) {
    figureViewport.classList.toggle('is-zoomed', zoomed);
    zoomButton.textContent = zoomed ? 'Fit to width' : 'Zoom in';
    figureViewport.scrollTo(0, 0);
  }

  function openFigure(id) {
    if (id) selectFigure(id);
    $('#dialog-title').textContent = `${selectedFigure.label} · ${selectedFigure.title}`;
    $('#dialog-image').src = selectedFigure.image;
    $('#dialog-image').alt = `${selectedFigure.label}: ${selectedFigure.title}`;
    if (!figureDialog.open) figureDialog.showModal();
    setFigureZoom(false);
    document.body.style.overflow = 'hidden';
  }
  $('.figure-image-button').addEventListener('click', () => openFigure());
  $('#enlarge-figure').addEventListener('click', () => openFigure());
  document.querySelectorAll('.open-figure').forEach((button) => button.addEventListener('click', () => openFigure(button.dataset.figure)));
  document.querySelectorAll('[data-select-figure]').forEach((link) => link.addEventListener('click', () => selectFigure(link.dataset.selectFigure)));
  zoomButton.addEventListener('click', () => setFigureZoom(!figureViewport.classList.contains('is-zoomed')));
  $('#close-dialog').addEventListener('click', () => figureDialog.close());
  figureDialog.addEventListener('close', () => { document.body.style.overflow = ''; });
  figureDialog.addEventListener('click', (event) => {
    if (event.target !== figureDialog) return;
    const bounds = figureDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) figureDialog.close();
  });
  function readHash() {
    const id = location.hash.slice(1);
    if (figures.some((f) => f.id === id)) {
      selectFigure(id);
      $('#figures').scrollIntoView({behavior: 'instant'});
    }
  }
  selectFigure('figure2');
  window.addEventListener('hashchange', readHash);
  if (location.hash.startsWith('#figure')) requestAnimationFrame(readHash);
})();
