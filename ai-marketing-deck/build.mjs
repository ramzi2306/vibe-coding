// Builds the deck: HTML slides (generated plates + text set in code) -> slides/NN.png
// Usage: node build.mjs            (all slides)   |   node build.mjs 5 6   (only these)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { slides } from './deck.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const font = (pkg, file) => 'file://' + path.join(root, 'node_modules/@fontsource', pkg, 'files', file);

const css = `
@font-face{font-family:Playfair;font-weight:900;font-style:italic;src:url(${font('playfair-display', 'playfair-display-latin-900-italic.woff2')})}
@font-face{font-family:Playfair;font-weight:900;font-style:normal;src:url(${font('playfair-display', 'playfair-display-latin-900-normal.woff2')})}
@font-face{font-family:Inter;font-weight:500;src:url(${font('inter', 'inter-latin-500-normal.woff2')})}
@font-face{font-family:Inter;font-weight:700;src:url(${font('inter', 'inter-latin-700-normal.woff2')})}
@font-face{font-family:Inter;font-weight:800;src:url(${font('inter', 'inter-latin-800-normal.woff2')})}
:root{--bg:#030303;--lime:#b3e621;--lime-hi:#f1f758;--ink:#f4f4f2;--mute:#9b9d96;--line:rgba(255,255,255,.07)}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#000;font-family:Inter,sans-serif;color:var(--ink)}
.s{position:relative;width:1920px;height:1080px;overflow:hidden;background:var(--bg)}
.plate{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.shade{position:absolute;inset:0}
.grain{position:absolute;inset:0;opacity:.11;mix-blend-mode:screen;pointer-events:none}
.grid i{position:absolute;background:var(--line)}
.crop b{position:absolute;width:26px;height:26px;border:0 solid rgba(255,255,255,.55)}
.foot{position:absolute;left:64px;right:64px;bottom:44px;display:flex;justify-content:space-between;font:700 15px Inter;letter-spacing:.18em;color:rgba(255,255,255,.42);text-transform:uppercase}
.txt{position:absolute;display:flex;flex-direction:column;gap:26px}
.k{font:800 25px Inter;letter-spacing:.14em;text-transform:uppercase;color:var(--ink)}
.t{font:italic 900 132px/0.98 Playfair,serif;font-variant-numeric:lining-nums;color:var(--lime);letter-spacing:-.01em;text-shadow:0 0 34px rgba(179,230,33,.55),0 0 90px rgba(179,230,33,.28);padding-bottom:.08em}
.t.off{color:#c9cbc4;text-shadow:none}
.sub{font:500 37px/1.32 Inter;color:var(--ink);max-width:19em}
.sub em,.li em,.cap em{font-style:normal;color:var(--lime)}
.list{display:flex;flex-direction:column;gap:17px;margin-top:6px}
.li{display:flex;gap:20px;align-items:baseline;font:500 30px/1.28 Inter;color:var(--ink)}
.li b{flex:none;min-width:46px;height:46px;padding:0 12px;border-radius:23px;background:var(--lime);color:#0a1200;font:800 22px/46px Inter;text-align:center;letter-spacing:.04em;transform:translateY(-3px)}
.li span{color:var(--mute)}
.rule{font:800 24px Inter;letter-spacing:.14em;text-transform:uppercase;color:var(--lime);margin-top:10px}
.tag{align-self:flex-start;font:800 17px Inter;letter-spacing:.16em;text-transform:uppercase;color:var(--mute);border:1px solid rgba(255,255,255,.25);padding:7px 13px;border-radius:99px}
.log{display:flex;flex-direction:column;gap:13px;font:500 29px/1.25 Inter}
.log div{display:flex;gap:22px}.log i{font-style:normal;font-weight:800;color:var(--lime);min-width:92px;font-variant-numeric:tabular-nums}
.cols{display:flex;gap:56px}.cols h4{font:800 20px Inter;letter-spacing:.16em;color:var(--lime);text-transform:uppercase;margin-bottom:14px}
.cols p{font:500 29px/1.5 Inter;color:var(--ink)}
`;

const grain = `<svg class="grain" width="1920" height="1080"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;
const chrome = (n, total) => `
<div class="grid"><i style="left:64px;top:0;width:1px;height:100%"></i><i style="right:64px;top:0;width:1px;height:100%"></i><i style="top:64px;left:0;height:1px;width:100%"></i><i style="bottom:96px;left:0;height:1px;width:100%"></i></div>
<div class="crop"><b style="left:26px;top:26px;border-left-width:2px;border-top-width:2px"></b><b style="right:26px;top:26px;border-right-width:2px;border-top-width:2px"></b><b style="left:26px;bottom:26px;border-left-width:2px;border-bottom-width:2px"></b><b style="right:26px;bottom:26px;border-right-width:2px;border-bottom-width:2px"></b></div>
${grain}
<div class="foot"><span>Ramzi Ikouirene · ramzi.digital</span><span>${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span></div>`;

const img = (f) => 'file://' + path.join(root, 'gen', f);

function hero(s) {
  const side = s.side || 'left';
  const w = s.w || 860;
  const pos = side === 'left' ? `left:112px` : `right:112px`;
  const shade = side === 'left'
    ? `linear-gradient(90deg,rgba(3,3,3,.96) 0%,rgba(3,3,3,.86) ${s.fade || 30}%,rgba(3,3,3,0) ${(s.fade || 30) + 26}%)`
    : `linear-gradient(270deg,rgba(3,3,3,.96) 0%,rgba(3,3,3,.86) ${s.fade || 30}%,rgba(3,3,3,0) ${(s.fade || 30) + 26}%)`;
  return `${s.img ? `<img class="plate" src="${img(s.img)}" style="${s.imgStyle || ''}">` : ''}
<div class="shade" style="background:${s.shade || shade}"></div>
<div class="shade" style="background:linear-gradient(0deg,rgba(3,3,3,.7) 0%,rgba(3,3,3,0) 18%)"></div>
<div class="txt" style="${pos};top:${s.top || 0}px;bottom:${s.top ? 'auto' : '0'};justify-content:center;width:${w}px">
${s.k ? `<div class="k">${s.k}</div>` : ''}
<div class="t" style="font-size:${s.ts || 132}px">${s.t}</div>
${s.sub ? `<div class="sub">${s.sub}</div>` : ''}
${s.html || ''}
</div>`;
}

const total = slides.length;
const body = slides.map((s, i) => `<section class="s" id="s${i + 1}">${s.raw ? s.raw({ img }) : hero(s)}${chrome(i + 1, total)}</section>`).join('\n');
const html = `<!doctype html><meta charset="utf-8"><style>${css}${slides.map((s) => s.css || '').join('\n')}</style>${body}`;
fs.writeFileSync(path.join(root, 'slides.html'), html);

// no em dash or en dash anywhere in the copy (DA rule)
if (/[–—]/.test(body)) { console.error('DASH FOUND in copy'); process.exit(1); }

const only = process.argv.slice(2).map(Number);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(root, 'slides.html'));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
fs.mkdirSync(path.join(root, 'slides'), { recursive: true });
for (let i = 1; i <= total; i++) {
  if (only.length && !only.includes(i)) continue;
  await page.locator(`#s${i}`).screenshot({ path: path.join(root, 'slides', String(i).padStart(2, '0') + '.png') });
}
await browser.close();
console.log('built', only.length ? only.join(',') : total, 'slides');
