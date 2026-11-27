'use strict';

(() => {
  const $ = (selector) => document.querySelector(selector);
  const datasets = (window.INTERACTIVE_DATASETS || []).filter(({data}) =>
    data?.frames?.length && data?.observed?.length && data?.curve?.length
  );
  const panel = $('#explorer-panel');
  const status = $('#explorer-status');
  if (!datasets.length) {
    panel.hidden = true;
    status.hidden = false;
    status.textContent = 'Interactive data could not be loaded.';
    return;
  }
  if (datasets.length < window.INTERACTIVE_DATASETS.length) {
    status.hidden = false;
    status.textContent = 'Some interactive datasets could not be loaded.';
  }

  const tabs = $('#dataset-tabs');
  const slider = $('#time-slider');
  const play = $('#play');
  const canvas = $('#population-plot');
  const svg = $('#score-plot');
  const background = document.createElement('canvas');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const width = 640, height = 420;
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const palette = ['#834e99', '#795ba6', '#705ead', '#566fab', '#358697', '#339c8a', '#58b66f', '#76c653', '#9ccf35', '#c4d833', '#e4df24'];
  const colors = palette.map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
  const boundsByDataset = new Map();
  let current, timeMin, timeMax, bounds, pixelRatio;
  let scoreX, scoreY, scoreReveal, cursor, cursorDot;
  let frameIndex = 0, timer = null;

  function timeLabel(time) {
    return current.timeUnit === 'h' ? `${Number(time.toFixed(2))} h` : `Day ${Number(time.toFixed(3))}`;
  }

  function colorAt(time) {
    const position = (time - timeMin) / (timeMax - timeMin) * (colors.length - 1);
    const low = Math.floor(position);
    const high = Math.min(low + 1, colors.length - 1);
    const rgb = colors[low].map((value, channel) => Math.round(value + (colors[high][channel] - value) * (position - low)));
    return `rgb(${rgb.join(',')})`;
  }

  function getBounds({key, data}) {
    if (boundsByDataset.has(key)) return boundsByDataset.get(key);
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    function include(points) {
      for (const [x, y] of points) {
        xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
        ymin = Math.min(ymin, y); ymax = Math.max(ymax, y);
      }
    }
    include(data.observed);
    for (const frame of data.frames) include(frame.points);
    const xpad = (xmax - xmin) * 0.09 || 1, ypad = (ymax - ymin) * 0.1 || 1;
    const padded = [xmin - xpad, xmax + xpad, ymin - ypad, ymax + ypad];
    boundsByDataset.set(key, padded);
    return padded;
  }

  function drawPoints(ctx, points, radius) {
    const [xmin, xmax, ymin, ymax] = bounds;
    for (const [x, y] of points) {
      const plotX = 52 + (x - xmin) / (xmax - xmin) * 560;
      const plotY = 365 - (y - ymin) / (ymax - ymin) * 337;
      ctx.beginPath(); ctx.arc(plotX, plotY, radius, 0, Math.PI * 2); ctx.fill();
    }
  }

  function buildBackground() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = background.width = width * pixelRatio;
    canvas.height = background.height = height * pixelRatio;
    const ctx = background.getContext('2d');
    ctx.scale(pixelRatio, pixelRatio);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#d1dae7';
    drawPoints(ctx, current.data.observed, 1.9);
    ctx.strokeStyle = '#bdc8d9'; ctx.lineWidth = 1.25;
    ctx.beginPath(); ctx.moveTo(52, 25); ctx.lineTo(52, 365); ctx.lineTo(612, 365); ctx.stroke();
    ctx.fillStyle = '#506178'; ctx.font = '500 17px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(current.axes[0], 335, 407);
    ctx.save(); ctx.translate(18, 198); ctx.rotate(-Math.PI / 2); ctx.fillText(current.axes[1], 0, 0); ctx.restore();
  }

  function drawPopulation(frame) {
    if (pixelRatio !== Math.min(window.devicePixelRatio || 1, 2)) buildBackground();
    const ctx = canvas.getContext('2d');
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.drawImage(background, 0, 0, width, height);
    const color = colorAt(frame.time);
    ctx.globalAlpha = 0.8; ctx.fillStyle = color;
    drawPoints(ctx, frame.points, 2.65);
    ctx.globalAlpha = 1;
    const sampled = current.data.measurementTimes.some((time) => Math.abs(time - frame.time) < 1e-8);
    $('#frame-note').textContent = `${frame.points.length} displayed reconstruction points · ${sampled ? 'sampled time' : 'unsampled time'}`;
    canvas.setAttribute('aria-label', `${frame.points.length} reconstructed points at ${timeLabel(frame.time)} on the fixed ${current.projection} reference, against ${current.data.observed.length} observed cells. ${sampled ? 'Measurements exist at this time.' : 'This time was not sampled.'}`);
    $('.reconstructed-key').style.background = color;
  }

  function svgElement(tag, attributes, text) {
    const element = document.createElementNS(svgNamespace, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function renderScore() {
    const {score, data, timeTicks, timeUnit} = current;
    svg.replaceChildren();
    scoreX = (time) => 55 + (time - timeMin) / (timeMax - timeMin) * 555;
    scoreY = (value) => 365 - value / score.maximum * 328;
    const path = data.curve.map(([time, value], i) => `${i ? 'L' : 'M'}${scoreX(time).toFixed(3)},${scoreY(value).toFixed(3)}`).join(' ');
    const defs = svgElement('defs', {});
    const clip = svgElement('clipPath', {id: 'score-time-clip'});
    scoreReveal = svgElement('rect', {x: 55, y: 0, width: 0, height});
    clip.append(scoreReveal);
    defs.append(clip);
    svg.append(defs);
    for (let value = 0; value <= score.maximum + 1e-9; value += score.tick) {
      svg.append(svgElement('line', {x1: 55, x2: 610, y1: scoreY(value), y2: scoreY(value), stroke: '#dde4ef'}));
      svg.append(svgElement('text', {x: 42, y: scoreY(value) + 5, class: 'plot-tick', 'text-anchor': 'end'}, Number(value.toFixed(2))));
    }
    for (const tick of timeTicks) {
      if (tick < timeMin || tick > timeMax) continue;
      svg.append(svgElement('text', {x: scoreX(tick), y: 386, class: 'plot-tick', 'text-anchor': 'middle'}, tick));
    }
    svg.append(svgElement('text', {x: 330, y: 411, class: 'plot-axis-label', 'text-anchor': 'middle'}, `Time (${timeUnit})`));
    svg.append(svgElement('text', {transform: 'translate(15,200) rotate(-90)', class: 'plot-axis-label', 'text-anchor': 'middle'}, score.heading));
    svg.append(svgElement('path', {d: path, 'clip-path': 'url(#score-time-clip)', class: 'score-stroke', fill: 'none', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
    cursor = svgElement('line', {x1: 55, x2: 55, y1: 37, y2: 365, stroke: '#7586a2', 'stroke-width': 1.5, 'stroke-dasharray': '4 5'});
    cursorDot = svgElement('circle', {cx: 55, cy: scoreY(1), r: 5, class: 'score-stroke', fill: '#fff', 'stroke-width': 2.5});
    svg.append(cursor, cursorDot);
  }

  function updateScore(time) {
    const x = scoreX(time);
    scoreReveal.setAttribute('width', x - scoreX(timeMin));
    cursor.setAttribute('x1', x);
    cursor.setAttribute('x2', x);
    const {score, data: {curve}} = current;
    const available = time >= curve[0][0] && time <= curve.at(-1)[0];
    cursorDot.setAttribute('visibility', available ? 'visible' : 'hidden');
    if (!available) {
      $('#score-value').textContent = 'Unavailable';
      svg.setAttribute('aria-label', `${score.heading} unavailable at ${timeLabel(time)}. Cached scores are available from ${timeLabel(curve[0][0])} to ${timeLabel(curve.at(-1)[0])}.`);
      return;
    }
    const right = curve.findIndex(([sampleTime]) => sampleTime >= time);
    const [rightTime, rightScore] = curve[right];
    let value = rightScore;
    if (time < rightTime) {
      const [leftTime, leftScore] = curve[right - 1];
      value = leftScore + (rightScore - leftScore) * (time - leftTime) / (rightTime - leftTime);
    }
    cursorDot.setAttribute('cx', x);
    cursorDot.setAttribute('cy', scoreY(value));
    $('#score-value').textContent = `${score.symbol} = ${value.toFixed(2)}`;
    svg.setAttribute('aria-label', `${score.heading} through ${timeLabel(time)}, current value ${value.toFixed(2)}`);
  }

  function updateFrame(index) {
    frameIndex = Math.max(0, Math.min(index, current.data.frames.length - 1));
    const frame = current.data.frames[frameIndex];
    const label = timeLabel(frame.time);
    slider.value = frameIndex;
    slider.setAttribute('aria-valuetext', label);
    $('#time-output').textContent = label;
    drawPopulation(frame);
    updateScore(frame.time);
  }

  function stop() {
    window.clearInterval(timer);
    timer = null;
    play.textContent = '▶ Play';
    play.setAttribute('aria-label', 'Play population reconstruction');
  }

  function selectDataset(next) {
    stop();
    current = next;
    timeMin = next.data.frames[0].time;
    timeMax = next.data.frames.at(-1).time;
    bounds = getBounds(next);
    $('#explorer-title').textContent = next.title;
    $('#dataset-badge').textContent = next.badge;
    $('#observed-legend').textContent = next.observedLegend || 'All observed cells';
    $('#score-heading').textContent = next.score.heading;
    $('#score-legend').textContent = next.score.legend;
    $('#explorer-footnote').textContent = next.details;
    tabs.querySelectorAll('button').forEach((button) => {
      const active = button.dataset.dataset === next.key;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `tab-dataset-${next.key}`);
    slider.max = next.data.frames.length - 1;
    buildBackground();
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
    button.setAttribute('aria-controls', panel.id);
    button.textContent = entry.tab;
    button.addEventListener('click', () => selectDataset(entry));
    button.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % datasets.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + datasets.length) % datasets.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = datasets.length - 1;
      else return;
      event.preventDefault();
      selectDataset(datasets[next]);
      $(`#tab-dataset-${datasets[next].key}`).focus();
    });
    tabs.append(button);
  });

  slider.addEventListener('input', () => { stop(); updateFrame(Number(slider.value)); });
  play.addEventListener('click', () => {
    if (timer !== null) { stop(); return; }
    const lastFrame = current.data.frames.length - 1;
    if (frameIndex === lastFrame) updateFrame(0);
    play.textContent = 'Ⅱ Pause';
    play.setAttribute('aria-label', 'Pause population reconstruction');
    const [normalDelay, reducedDelay] = current.frameDelays || [850, 1600];
    timer = window.setInterval(() => {
      updateFrame(frameIndex + 1);
      if (frameIndex === lastFrame) stop();
    }, motionPreference.matches ? reducedDelay : normalDelay);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stop(); }, {threshold: 0.1}).observe(panel);
  }
  selectDataset(datasets[0]);
})();
