#!/usr/bin/env node
// Generate local avatar SVGs for the demo users so the UI doesn't depend on
// an external service (DiceBear). Each avatar is a 200x200 SVG with a gradient
// background and the user's initials in white.
const fs = require('fs');
const path = require('path');

const avatars = [
  { name: 'Aung Kyaw', color1: '#2563eb', color2: '#7c3aed' },
  { name: 'Ko Min',    color1: '#0891b2', color2: '#3b82f6' },
  { name: 'Ma Thida',  color1: '#16a34a', color2: '#22c55e' },
  { name: 'Kyaw Zin',  color1: '#dc2626', color2: '#f59e0b' },
  { name: 'U Hla',     color1: '#7c2d12', color2: '#ea580c' },
  { name: 'Ko Aye',    color1: '#0d9488', color2: '#06b6d4' },
  { name: 'Zaw Lin',   color1: '#6366f1', color2: '#a855f7' },
  { name: 'Admin',     color1: '#1f2937', color2: '#475569' },
];

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const outDir = path.resolve(__dirname, '../uploads/avatars');
fs.mkdirSync(outDir, { recursive: true });

for (const a of avatars) {
  const text = initials(a.name);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a.color1}"/>
      <stop offset="100%" stop-color="${a.color2}"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#g)"/>
  <text x="100" y="100" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="80" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="central">${text}</text>
</svg>`;
  const file = path.join(outDir, `${slug(a.name)}.svg`);
  fs.writeFileSync(file, svg);
  console.log('Wrote', file);
}
