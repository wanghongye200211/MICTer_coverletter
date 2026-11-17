'use strict';
(() => {
  const $ = (selector) => document.querySelector(selector);
  const figures = window.FIGURES;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const figureDialog = $('#image-dialog');
  const figureViewport = $('#dialog-figure');
  const zoomButton = $('#zoom-figure');
  let selectedFigure = figures[0];
  let frameIndex = 0;
  let timer = null;

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

  // Use cached populations and scores on a shared display timeline.
  const datasets = [
    {
      key: 'endoderm',
      tab: 'Endoderm',
      title: 'Endoderm · GSE75748 · 0–96 h',
      badge: 'Time course · 6 stages',
      axisX: 'PC 1',
      axisY: 'PC 2',
      projection: 'PC',
      timeUnit: 'h',
      timeMin: 0,
      timeMax: 96,
      timeTicks: [0, 12, 24, 36, 48, 60, 72, 84, 96],
      scoreMax: 3,
      scoreTick: 1,
      scoreHeading: 'Transition score',
      scoreSymbol: 'C(t)',
      scoreLegend: '32-rollout mean',
      observedLegend: 'All observed cells',
      frameDelays: [33, 60],
      footnote: 'Displayed populations are reconstructed snapshots, not tracked descendants. Frames are spaced about 0.32 hours apart (300 frames). The score is sampled every 0.6 hour. The full time course contributed to model fitting.',
      data: window.SCIENCE_DATA_ENDODERM
    },
    {
      key: 'ipsc',
      tab: 'Targeted iPSC',
      title: 'Targeted iPSC · days 0–5',
      badge: 'RT-qPCR · 96 genes',
      axisX: 'UMAP 1',
      axisY: 'UMAP 2',
      projection: 'UMAP',
      timeUnit: 'day',
      timeMin: 0,
      timeMax: 5,
      frameDelays: [100, 160],
      timeTicks: [0, 1, 2, 3, 4, 5],
      scoreMax: 9,
      scoreTick: 2,
      scoreHeading: 'Transition score',
      scoreSymbol: 'C(t)',
      scoreLegend: '32-rollout mean',
      observedLegend: 'All observed cells',
      footnote: 'The iPSC rollout shows 102 reconstructed population snapshots. The score is sampled every 0.025 day. The full time course contributed to model fitting.',
      data: window.SCIENCE_DATA
    },
    {
      key: 'emt',
      tab: 'EMT/MET',
      title: 'EMT/MET · days 0–30',
      badge: 'Time course · 5 stages',
      axisX: 't-SNE 1',
      axisY: 't-SNE 2',
      projection: 't-SNE',
      timeUnit: 'day',
      timeMin: 0,
      timeMax: 30,
      timeTicks: [0, 5, 10, 15, 20, 25, 30],
      scoreMax: 1.4,
      scoreTick: 0.5,
      scoreHeading: 'Transition indicator',
      scoreSymbol: 'I(t)',
      scoreLegend: '32-rollout mean · trailing window · day 7 = 1',
      observedLegend: 'All observed cells',
      frameDelays: [100, 140],
      footnote: 'Displayed populations are reconstructed snapshots, not tracked descendants. The projection is the continuous-dynamics t-SNE fitted on observed cells and reconstructed trajectories (perplexity = 35). Frames are interpolated along 96 reconstructed trajectories and displayed as 384 particles over days 0–30. The indicator is defined from day 7; frames before day 7 are shown without an indicator value. The indicator uses a trailing 2.5-day window; each of the 32 rollouts is normalized to its own day-7 value and the curves are then averaged. The full time course contributed to model fitting.',
      data: window.SCIENCE_DATA_EMT_MET
    },
    {
      key: 'pancreatic',
      tab: 'Pancreatic endocrine',
      title: 'Pancreatic endocrine · GSE114412 · days 0–4',
      badge: 'scRNA-seq · 7 states',
      axisX: 'GAGA UMAP 1',
      axisY: 'GAGA UMAP 2',
      projection: 'GAGA UMAP',
      timeUnit: 'day',
      timeMin: 0,
      timeMax: 4,
      timeTicks: [0, 1, 2, 3, 4],
      scoreMax: 1.2,
      scoreTick: 0.2,
      scoreHeading: 'Transition indicator',
      scoreSymbol: 'I(t)',
      scoreLegend: '32-rollout mean · t0 = Day 0.5',
      observedLegend: 'All observed cells',
      footnote: 'Displayed populations are reconstructed snapshots, not tracked descendants. Frames have 0.1-day spacing; the indicator has 0.025-day spacing. The full time course contributed to model fitting.',
      data: window.SCIENCE_DATA_PANCREATIC
    },
    {
      key: 'cardiac',
      tab: 'Cardiac differentiation',
      title: 'Cardiac differentiation · GSE175634 · days 0–7',
      badge: 'scRNA-seq · 7 states',
      axisX: 'GAGA UMAP 1',
      axisY: 'GAGA UMAP 2',
      projection: 'GAGA UMAP',
      timeUnit: 'day',
      timeMin: 0,
      timeMax: 7,
      timeTicks: [0, 1, 2, 3, 4, 5, 6, 7],
      scoreMax: 1.2,
      scoreTick: 0.2,
      scoreHeading: 'Transition indicator',
      scoreSymbol: 'I(t)',
      scoreLegend: '32-rollout mean · t0 = Day 0.5',
      observedLegend: 'Observed cells · 8,000 shown',
      footnote: 'Displayed populations are reconstructed snapshots, not tracked descendants. Frames have 0.1-day spacing; the indicator has 0.025-day spacing. The full time course contributed to model fitting.',
      data: window.SCIENCE_DATA_CARDIAC
    }
  ].filter((entry) => entry.data);

  const palette = ['#834e99', '#795ba6', '#705ead', '#566fab', '#358697', '#339c8a', '#58b66f', '#76c653', '#9ccf35', '#c4d833', '#e4df24'];
  const paletteRgb = palette.map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
  function frameColor(progress) {
    const position = progress * (paletteRgb.length - 1);
    const low = Math.floor(position);
    const high = Math.min(low + 1, paletteRgb.length - 1);
    const mix = position - low;
    const rgb = paletteRgb[low].map((value, channel) => Math.round(value + (paletteRgb[high][channel] - value) * mix));
    return `rgb(${rgb.join(',')})`;
  }

  const canvas = $('#population-plot');
  const svg = $('#score-plot');
  const ns = 'http://www.w3.org/2000/svg';
  const observedLayer = document.createElement('canvas');
  let current = datasets[0];
  let xmin = 0, xmax = 1, ymin = 0, ymax = 1;
  let scoreX, scoreY, scoreReveal, cursor, cursorDot;

  function svgElement(tag, attributes, text) {
    const element = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function timeLabel(value) {
    if (current.timeUnit === 'h') return `${Number(value.toFixed(1))} h`;
    return `Day ${value.toFixed(3).replace(/(\.\d{2})0$/, '$1')}`;
  }
  function computeBounds() {
    const points = current.data.observed.concat(current.data.frames.flatMap((frame) => frame.points));
    xmin = Infinity; xmax = -Infinity; ymin = Infinity; ymax = -Infinity;
    for (const [x, y] of points) { xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
    const xpad = (xmax - xmin) * .09, ypad = (ymax - ymin) * .1;
    xmin -= xpad; xmax += xpad; ymin -= ypad; ymax += ypad;
  }
  function plotX(value) { return 52 + (value - xmin) / (xmax - xmin) * 560; }
  function plotY(value) { return 365 - (value - ymin) / (ymax - ymin) * 337; }
  function buildObservedLayer() {
    const width = 640, height = 420;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    observedLayer.width = width * dpr;
    observedLayer.height = height * dpr;
    const ctx = observedLayer.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#d1dae7';
    for (const point of current.data.observed) {
      ctx.beginPath(); ctx.arc(plotX(point[0]), plotY(point[1]), 1.9, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawPopulation() {
    const width = 640, height = 420;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr; canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.drawImage(observedLayer, 0, 0, width, height);
    ctx.strokeStyle = '#bdc8d9'; ctx.lineWidth = 1.25;
    ctx.beginPath(); ctx.moveTo(52, 25); ctx.lineTo(52, 365); ctx.lineTo(612, 365); ctx.stroke();
    ctx.fillStyle = '#506178'; ctx.font = '500 17px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(current.axisX, 335, 407);
    ctx.save(); ctx.translate(18, 198); ctx.rotate(-Math.PI / 2); ctx.fillText(current.axisY, 0, 0); ctx.restore();
    const frame = current.data.frames[frameIndex];
    const color = frameColor((frame.time - current.timeMin) / (current.timeMax - current.timeMin));
    ctx.globalAlpha = .8;
    ctx.fillStyle = color;
    for (const point of frame.points) {
      ctx.beginPath(); ctx.arc(plotX(point[0]), plotY(point[1]), 2.65, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const label = timeLabel(frame.time);
    const measured = current.data.measurementTimes.includes(frame.time);
    $('#frame-note').textContent = `${frame.points.length} simulated particles · ${measured ? 'measured stage' : 'unmeasured intermediate stage'}`;
    canvas.setAttribute('aria-label', `${frame.points.length} reconstructed particles at ${label} on the fixed ${current.projection} reference, against ${current.data.observed.length} observed cells. ${measured ? 'Measurements exist at this stage.' : 'This intermediate stage was not sampled.'}`);
    $('.reconstructed-key').style.background = color;
  }
  function renderScore() {
    const meta = current, data = meta.data;
    svg.replaceChildren();
    scoreX = (value) => 55 + (value - meta.timeMin) / (meta.timeMax - meta.timeMin) * 555;
    scoreY = (value) => 365 - value / meta.scoreMax * 328;
    const path = data.curve.map((row, i) => `${i ? 'L' : 'M'}${scoreX(row[0]).toFixed(3)},${scoreY(row[1]).toFixed(3)}`).join(' ');
    const defs = svgElement('defs', {});
    const clip = svgElement('clipPath', {id: 'score-time-clip'});
    scoreReveal = svgElement('rect', {x: 55, y: 0, width: 0, height: 420});
    clip.append(scoreReveal);
    defs.append(clip);
    svg.append(defs);
    for (let value = 0; value <= meta.scoreMax + 1e-9; value += meta.scoreTick) {
      svg.append(svgElement('line', {x1: 55, x2: 610, y1: scoreY(value), y2: scoreY(value), stroke: '#dde4ef'}));
      svg.append(svgElement('text', {x: 42, y: scoreY(value) + 5, class: 'plot-tick', 'text-anchor': 'end'}, Number(value.toFixed(2))));
    }
    for (const tick of meta.timeTicks) {
      svg.append(svgElement('text', {x: scoreX(tick), y: 386, class: 'plot-tick', 'text-anchor': 'middle'}, tick));
    }
    svg.append(svgElement('text', {x: 330, y: 411, class: 'plot-axis-label', 'text-anchor': 'middle'}, `Time (${meta.timeUnit})`));
    svg.append(svgElement('text', {transform: 'translate(15,200) rotate(-90)', class: 'plot-axis-label', 'text-anchor': 'middle'}, meta.scoreHeading));
    svg.append(svgElement('path', {d: path, 'clip-path': 'url(#score-time-clip)', class: 'score-stroke', fill: 'none', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
    cursor = svgElement('line', {x1: 55, x2: 55, y1: 37, y2: 365, stroke: '#7586a2', 'stroke-width': 1.5, 'stroke-dasharray': '4 5'});
    cursorDot = svgElement('circle', {cx: 55, cy: scoreY(1), r: 5, class: 'score-stroke', fill: '#fff', 'stroke-width': 2.5});
    svg.append(cursor, cursorDot);
  }
  function updateScore(time) {
    const x = scoreX(time);
    scoreReveal.setAttribute('width', x - scoreX(current.timeMin));
    cursor.setAttribute('x1', x);
    cursor.setAttribute('x2', x);
    const curve = current.data.curve;
    const scoreAvailable = time >= curve[0][0] && time <= curve.at(-1)[0];
    cursorDot.setAttribute('visibility', scoreAvailable ? 'visible' : 'hidden');
    if (!scoreAvailable) {
      $('#score-value').textContent = '—';
      svg.setAttribute('aria-label', `${current.scoreHeading} unavailable at ${timeLabel(time)}`);
      return;
    }
    const rightIndex = curve.findIndex(([t]) => t >= time);
    const [rightTime, rightScore] = curve[rightIndex];
    let score = rightScore;
    if (time < rightTime) {
      const [leftTime, leftScore] = curve[rightIndex - 1];
      score = leftScore + (rightScore - leftScore) * (time - leftTime) / (rightTime - leftTime);
    }
    cursorDot.setAttribute('cx', x);
    cursorDot.setAttribute('cy', scoreY(score));
    $('#score-value').textContent = `${current.scoreSymbol} = ${score.toFixed(2)}`;
    svg.setAttribute('aria-label', `${current.scoreHeading} through ${timeLabel(time)}, current value ${score.toFixed(2)}`);
  }
  function updateFrame(index) {
    frameIndex = Math.max(0, Math.min(index, current.data.frames.length - 1));
    const time = current.data.frames[frameIndex].time;
    $('#time-slider').value = frameIndex;
    const label = timeLabel(time);
    $('#time-output').textContent = label;
    $('#time-slider').setAttribute('aria-valuetext', label);
    drawPopulation();
    updateScore(time);
  }
  function stop() {
    window.clearInterval(timer); timer = null;
    $('#play').textContent = '▶ Play'; $('#play').setAttribute('aria-label', 'Play population reconstruction');
  }
  function selectDataset(key) {
    const next = datasets.find((entry) => entry.key === key) || datasets[0];
    stop();
    current = next;
    $('#explorer-title').textContent = next.title;
    $('#dataset-badge').textContent = next.badge;
    $('#observed-legend').textContent = next.observedLegend;
    $('#score-heading').textContent = next.scoreHeading;
    $('#score-legend').textContent = next.scoreLegend;
    $('#explorer-footnote').textContent = next.footnote;
    $('#dataset-tabs').querySelectorAll('button').forEach((button) => {
      const active = button.dataset.dataset === next.key;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $('#explorer-panel').setAttribute('aria-labelledby', `tab-dataset-${next.key}`);
    $('#time-slider').max = next.data.frames.length - 1;
    computeBounds();
    buildObservedLayer();
    renderScore();
    updateFrame(0);
  }
  datasets.forEach((entry, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dataset-tab';
    button.id = `tab-dataset-${entry.key}`;
    button.dataset.dataset = entry.key;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'explorer-panel');
    button.setAttribute('aria-selected', 'false');
    button.textContent = entry.tab;
    button.addEventListener('click', () => selectDataset(entry.key));
    button.addEventListener('keydown', (event) => {
      let next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % datasets.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + datasets.length) % datasets.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = datasets.length - 1;
      else return;
      event.preventDefault();
      selectDataset(datasets[next].key);
      $(`#tab-dataset-${datasets[next].key}`).focus();
    });
    $('#dataset-tabs').append(button);
  });
  $('#time-slider').addEventListener('input', (event) => { stop(); updateFrame(Number(event.target.value)); });
  $('#play').addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (frameIndex === current.data.frames.length - 1) updateFrame(0);
    $('#play').textContent = 'Ⅱ Pause'; $('#play').setAttribute('aria-label', 'Pause population reconstruction');
    const [normalDelay, reducedDelay] = current.frameDelays || [850, 1600];
    timer = window.setInterval(() => {
      updateFrame(frameIndex + 1);
      if (frameIndex === current.data.frames.length - 1) stop();
    }, motionPreference.matches ? reducedDelay : normalDelay);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  new IntersectionObserver((entries) => { if (!entries[0].isIntersecting) stop(); }, {threshold: .1}).observe($('.explorer'));
  selectDataset(datasets[0].key);
})();
