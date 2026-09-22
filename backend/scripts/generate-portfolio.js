#!/usr/bin/env node
// Generate placeholder portfolio images for the demo workers so the worker
// profile page has visual content even without real uploads.
const fs = require('fs');
const path = require('path');

const items = [
  { name: 'Aung Kyaw', label: 'Pipe repair', color1: '#1d4ed8', color2: '#06b6d4' },
  { name: 'Aung Kyaw', label: 'Toilet install', color1: '#0e7490', color2: '#22d3ee' },
  { name: 'Ko Min',    label: 'House wiring', color1: '#7c3aed', color2: '#ec4899' },
  { name: 'Ma Thida',  label: 'Deep clean',   color1: '#16a34a', color2: '#84cc16' },
  { name: 'Kyaw Zin',  label: 'Engine repair',color1: '#dc2626', color2: '#f59e0b' },
  { name: 'U Hla',     label: 'Custom shelf', color1: '#7c2d12', color2: '#dc2626' },
  { name: 'Ko Aye',    label: 'Delivery run', color1: '#0d9488', color2: '#06b6d4' },
];

const outDir = path.resolve(__dirname, '../uploads/portfolio');
fs.mkdirSync(outDir, { recursive: true });

items.forEach((it, i) => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${it.color1}"/>
      <stop offset="100%" stop-color="${it.color2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#g)"/>
  <g transform="translate(400,225)">
    <circle r="100" fill="rgba(255,255,255,0.15)"/>
    <text x="0" y="0" font-family="Inter, system-ui, sans-serif" font-size="48" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="central">${it.label}</text>
    <text x="0" y="80" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="500" fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="central">${it.name}</text>
  </g>
</svg>`;
  const file = path.join(outDir, `work-${i + 1}.svg`);
  fs.writeFileSync(file, svg);
  console.log('Wrote', file);
});
