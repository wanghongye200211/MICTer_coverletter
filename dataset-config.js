'use strict';

window.INTERACTIVE_DATASETS = [
  {
    key: 'endoderm',
    tab: 'Endoderm',
    title: 'Endoderm · GSE75748 · 0–96 h',
    badge: 'Time course · 6 sampled stages',
    axes: ['PC 1', 'PC 2'],
    projection: 'PCA',
    timeUnit: 'h',
    timeTicks: [0, 12, 24, 36, 48, 60, 72, 84, 96],
    frameDelays: [33, 60],
    score: {heading: 'Transition score', symbol: 'C(t)', maximum: 3, tick: 1, legend: '32-rollout mean'},
    details: 'The 300 reconstruction frames are about 0.32 hours apart. The score was evaluated every 0.6 hours.',
    data: window.SCIENCE_DATA_ENDODERM
  },
  {
    key: 'ipsc',
    tab: 'Targeted iPSC',
    title: 'Targeted iPSC · days 0–5',
    badge: 'RT-qPCR · 96 genes',
    axes: ['UMAP 1', 'UMAP 2'],
    projection: 'UMAP',
    timeUnit: 'day',
    timeTicks: [0, 1, 2, 3, 4, 5],
    frameDelays: [100, 160],
    score: {heading: 'Transition score', symbol: 'C(t)', maximum: 9, tick: 2, legend: '32-rollout mean'},
    details: 'One rollout supplies 102 reconstructed snapshots, including an extra frame at day 2.325. The score was evaluated every 0.025 days.',
    data: window.SCIENCE_DATA
  },
  {
    key: 'emt',
    tab: 'EMT/MET',
    title: 'EMT/MET · days 0–30',
    badge: 'Time course · 5 sampled stages',
    axes: ['PC 1', 'PC 2'],
    projection: 'PCA',
    timeUnit: 'day',
    timeTicks: [0, 5, 10, 15, 20, 25, 30],
    frameDelays: [100, 140],
    score: {heading: 'Transition indicator', symbol: 'I(t)', maximum: 1.4, tick: 0.5, legend: '32-rollout mean · day 7 = 1'},
    details: 'The 100 frames display 96 interpolated reconstructed trajectories using 384 plot positions on the observed-cell PCA reference. The indicator starts at day 7, uses a trailing 2.5-day window, and divides each rollout by its own day-7 value before averaging. This updated curve peaks at day 22.3. The linked static Figure 4 is an earlier export with a day 21.6 peak.',
    data: window.SCIENCE_DATA_EMT_MET
  },
  {
    key: 'pancreatic',
    tab: 'Pancreatic endocrine',
    title: 'Pancreatic endocrine · GSE114412 · days 0–4',
    badge: 'scRNA-seq · 7 states',
    axes: ['GAGA UMAP 1', 'GAGA UMAP 2'],
    projection: 'GAGA UMAP',
    timeUnit: 'day',
    timeTicks: [0, 1, 2, 3, 4],
    score: {heading: 'Transition indicator', symbol: 'I(t)', maximum: 1.2, tick: 0.2, legend: '32-rollout mean · day 0.5 = 1'},
    details: 'The 41 reconstruction frames are spaced 0.1 days apart. The indicator starts at day 0.5 and was evaluated every 0.025 days.',
    data: window.SCIENCE_DATA_PANCREATIC
  },
  {
    key: 'cardiac',
    tab: 'Cardiac differentiation',
    title: 'Cardiac differentiation · GSE175634 · days 0–7',
    badge: 'scRNA-seq · 7 states',
    axes: ['GAGA UMAP 1', 'GAGA UMAP 2'],
    projection: 'GAGA UMAP',
    timeUnit: 'day',
    timeTicks: [0, 1, 2, 3, 4, 5, 6, 7],
    observedLegend: 'Observed cells · 8,000 shown',
    score: {heading: 'Transition indicator', symbol: 'I(t)', maximum: 1.2, tick: 0.2, legend: '32-rollout mean · day 0.5 = 1'},
    details: 'The 71 reconstruction frames are spaced 0.1 days apart. The indicator starts at day 0.5 and was evaluated every 0.025 days.',
    data: window.SCIENCE_DATA_CARDIAC
  }
];
