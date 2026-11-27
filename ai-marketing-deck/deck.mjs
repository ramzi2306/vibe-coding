// Slide content. Text is set in code over the generated plates (gen/*.png).
// DA rule: no em dash or en dash anywhere in the copy (build.mjs checks it).

const list = (items) => `<div class="list">${items.map(([b, t]) => `<div class="li"><b>${b}</b><div>${t}</div></div>`).join('')}</div>`;

/* ---------- the marketing map (AI off / AI on) ---------- */
const channels = [
  ['SEO', 'A few articles a month, by hand', 'A content loop that feeds itself'],
  ['Social content', 'Idea, shoot, edit, post. Repeat.', 'One video becomes ten formats'],
  ['Video production', 'Studio, camera, editor, days', 'Faceless and AI avatar videos'],
  ['Media buying', 'A few creatives, checked when you can', '20 variations, watched 24/7'],
  ['Influencers and UGC', 'Scroll, DM, negotiate, spreadsheet', 'Scouted, scored and tracked'],
  ['Analytics', 'A monthly report, already old', 'Live dashboard and alerts'],
  ['Competitor watch', 'When you have time', 'A weekly intel brief, automatic'],
  ['Landing pages', 'One page, redesigned once a year', 'One page per audience, always testing'],
  ['Sales and order confirmation', 'Leads wait for hours', 'Instant replies, day and night'],
  ['Email and WhatsApp', 'One blast for everyone', 'One message per customer'],
];
const CX = 960, CY = 648, RX = 700, RY = 318;
const pts = channels.map((_, i) => {
  const a = (-90 + i * 36) * Math.PI / 180;
  return [Math.round(CX + RX * Math.cos(a)), Math.round(CY + RY * Math.sin(a))];
});
// outputs that feed other agents (drawn only when AI is on)
const cross = [[1, 0], [1, 2], [3, 4], [5, 6], [6, 7], [8, 9]];

function map(on) {
  const lines = pts.map(([x, y]) => `<line x1="${CX}" y1="${CY}" x2="${x}" y2="${y}" class="${on ? 'ln on' : 'ln'}"/>`).join('');
  const links = on ? cross.map(([a, b]) => {
    const [x1, y1] = pts[a], [x2, y2] = pts[b];
    const mx = (x1 + x2) / 2 + (CX - (x1 + x2) / 2) * 0.22, my = (y1 + y2) / 2 + (CY - (y1 + y2) / 2) * 0.22;
    return `<path d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" class="cross"/>`;
  }).join('') : '';
  const nodes = channels.map(([name, off, onTxt], i) => `<div class="node ${on ? 'on' : ''}" style="left:${pts[i][0]}px;top:${pts[i][1]}px"><h5>${name}</h5><p>${on ? onTxt : off}</p></div>`).join('');
  return () => `
<svg class="mapsvg" width="1920" height="1080"><defs><filter id="gl"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${links}${lines}</svg>
<div class="maphead"><div class="k">The marketing map</div><div class="t ${on ? '' : 'off'}" style="font-size:84px">${on ? 'Now flip the switch' : 'Everything by hand'}</div></div>
<div class="switch ${on ? 'on' : ''}"><span>AI</span><i><u></u></i><b>${on ? 'ON' : 'OFF'}</b></div>
<div class="core ${on ? 'on' : ''}" style="left:${CX}px;top:${CY}px"><h5>${on ? 'You + orchestrator' : 'Your team'}</h5><p>${on ? 'You design and supervise' : 'Everything passes through people'}</p></div>
${nodes}
<div class="mapnote">${on ? 'Every output becomes another agent&#39;s input. That is a <em>system</em>.' : 'Every new channel is a new hire.'}</div>`;
}

const mapCss = `
.mapsvg{position:absolute;inset:0}
.ln{stroke:rgba(255,255,255,.4);stroke-width:2;stroke-dasharray:3 9}
.ln.on{stroke:#b3e621;stroke-width:2;stroke-dasharray:none;opacity:.8}
.cross{fill:none;stroke:#fff;stroke-width:1.8;stroke-dasharray:2 8;opacity:.7}
.maphead{position:absolute;left:112px;top:92px;display:flex;flex-direction:column;gap:12px}
.switch{position:absolute;right:112px;top:112px;display:flex;align-items:center;gap:18px;font:800 30px Inter;letter-spacing:.12em;color:#8d8f89}
.switch i{width:110px;height:54px;border-radius:27px;background:#222;border:2px solid #555;position:relative}
.switch u{position:absolute;top:5px;left:5px;width:40px;height:40px;border-radius:50%;background:#8d8f89}
.switch.on{color:#b3e621}.switch.on i{background:#1c2a05;border-color:#b3e621;box-shadow:0 0 30px rgba(179,230,33,.55)}
.switch.on u{left:auto;right:5px;background:#b3e621;box-shadow:0 0 18px #b3e621}
.node,.core{position:absolute;transform:translate(-50%,-50%);width:360px;padding:16px 18px 18px;border-radius:16px;background:#0b0b0b;border:1.5px solid rgba(255,255,255,.22);text-align:center}
.node h5,.core h5{font:800 27px/1.15 Inter;color:#f4f4f2}
.node p,.core p{font:500 22px/1.28 Inter;color:#9b9d96;margin-top:7px}
.node.on{border-color:rgba(255,255,255,.7);background:#0b0b0b}
.node.on p{color:#f4f4f2}
.core{width:380px;padding:26px 22px;border-radius:26px;background:#141414;border-color:rgba(255,255,255,.5)}
.core h5{font-size:30px;text-transform:uppercase;letter-spacing:.06em}
.core.on{background:#b3e621;border-color:#f1f758;box-shadow:0 0 70px rgba(179,230,33,.6)}
.core.on h5{color:#0a1200}.core.on p{color:#1d2a00;font-weight:700}
.mapnote{position:absolute;right:112px;top:186px;width:560px;text-align:right;font:700 26px/1.3 Inter;color:#f4f4f2}
.mapnote em{font-style:normal;color:#b3e621}
`;


/* ---------- the agent loop (AI on): one agent per channel, each output feeds the next ---------- */
const agents = [
  ['Scout', 'Market intel', 'Watches competitors and trends', 'angles'],
  ['Writer', 'SEO', 'Turns customer questions into articles', 'scripts'],
  ['Studio', 'Content', 'Makes faceless and avatar videos', 'creatives'],
  ['Buyer', 'Media buying', 'Launches, tests and scales the ads', 'leads'],
  ['Closer', 'Sales', 'Answers and confirms every order', 'customers'],
  ['Keeper', 'Email and WhatsApp', 'Follows up and brings them back', 'feedback'],
  ['Analyst', 'Analytics', 'Reads every number, flags what moves', 'insights'],
];
const LX = 960, LY = 640, LRX = 650, LRY = 300;
const onRing = (deg, k = 1) => [LX + LRX * k * Math.cos(deg * Math.PI / 180), LY + LRY * k * Math.sin(deg * Math.PI / 180)];
const bot = `<svg viewBox="0 0 48 48" width="50" height="50" fill="none" stroke="#f4f4f2" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 4v7"/><circle cx="24" cy="4" r="2.2" fill="#f4f4f2"/><rect x="8" y="11" width="32" height="25" rx="8"/><circle cx="18" cy="23" r="3" fill="#f4f4f2"/><circle cx="30" cy="23" r="3" fill="#f4f4f2"/><path d="M19 30h10M4 21v7M44 21v7M17 36v6M31 36v6"/></svg>`;
const loop = () => {
  const step = 360 / agents.length;
  const cards = agents.map(([name, ch, role], i) => {
    const [x, y] = onRing(-90 + i * step);
    return `<div class="ag" style="left:${x}px;top:${y}px"><div class="agi">${bot}</div><div><span>${ch}</span><h5>${name}</h5><p>${role}</p></div></div>`;
  }).join('');
  const flows = agents.map(([, , , out], i) => {
    const a = -90 + (i + 0.5) * step, rad = a * Math.PI / 180;
    const [x, y] = onRing(a);
    const rot = Math.atan2(LRY * Math.cos(rad), -LRX * Math.sin(rad)) * 180 / Math.PI;
    const [tx, ty] = onRing(a, 0.74);
    return `<polygon points="-15,-12 15,0 -15,12" fill="#b3e621" transform="translate(${x} ${y}) rotate(${rot})"/><text x="${tx}" y="${ty + 8}" class="flow">${out}</text>`;
  }).join('');
  return `
<svg class="mapsvg" width="1920" height="1080"><defs><filter id="lg" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<ellipse cx="${LX}" cy="${LY}" rx="${LRX}" ry="${LRY}" fill="none" stroke="#b3e621" stroke-width="4" filter="url(#lg)"/>${flows}</svg>
<div class="maphead"><div class="k">The marketing map</div><div class="t" style="font-size:84px">Now flip the switch</div></div>
<div class="switch on"><span>AI</span><i><u></u></i><b>ON</b></div>
<div class="mapnote">Each agent's output is the next one's input.<br>The circle closes. That is a <em>system</em>.</div>
<div class="you"><h5>You</h5><p>design and supervise</p></div>
${cards}`;
};
const loopCss = `
.ag{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:16px;width:400px;padding:14px 22px 14px 14px;border-radius:70px;background:#0b0b0b;border:1.5px solid rgba(255,255,255,.7)}
.agi{flex:none;width:84px;height:84px;border-radius:50%;background:#1a1a1a;border:1.5px solid rgba(255,255,255,.35);display:grid;place-items:center}
.ag span{font:800 15px Inter;letter-spacing:.16em;text-transform:uppercase;color:#9b9d96}
.ag h5{font:italic 900 34px/1.05 Playfair;color:#f4f4f2;margin:1px 0 3px}
.ag p{font:500 19px/1.25 Inter;color:#d9dbd4}
.flow{font:800 21px Inter;letter-spacing:.14em;text-transform:uppercase;fill:#b3e621;text-anchor:middle}
.you{position:absolute;left:${LX}px;top:${LY}px;transform:translate(-50%,-50%);text-align:center}
.you h5{font:italic 900 96px/1 Playfair;color:#f4f4f2}
.you p{font:800 20px Inter;letter-spacing:.16em;text-transform:uppercase;color:#9b9d96;margin-top:6px}
`;


/* ---------- customer journey: what the customer sees, the agent behind it, what the agent is fed ---------- */
const journey = [
  ['Social content', 'Stops scrolling on a video', 'Studio', 'Writes, films, cuts and posts every day', 'Trends, comments, your best posts'],
  ['Media buying', 'Sees the right ad, at the right time', 'Buyer', 'Tests 20 versions, scales the winner', 'Winning videos, budget, margins'],
  ['Landing page', 'Lands on a page made for them', 'Builder', 'Builds one page per audience and angle', 'The ad angle, the product, reviews'],
  ['Analytics', 'Buys. The next visit is even better.', 'Analyst', 'Reads the whole journey, tells the others what to fix', 'Ad, page and order data'],
];
const journeySlide = () => {
  const X0 = 330, CW = 372, mid = (i) => X0 + i * CW + (CW - 16) / 2;
  const dots = journey.map((_, i) => `<circle cx="${mid(i)}" cy="318" r="13" fill="#b3e621"/>`).join('');
  const col = (cls, f) => journey.map((j, i) => `<div class="jc ${cls}" style="left:${X0 + i * CW}px">${f(j, i)}</div>`).join('');
  return `
<svg class="mapsvg" width="1920" height="1080"><defs><filter id="jg" x="-10%" y="-300%" width="120%" height="700%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<g filter="url(#jg)"><path d="M${mid(0)} 318 H${mid(3) + 150}" stroke="#b3e621" stroke-width="4" fill="none"/><polygon points="${mid(3) + 150},304 ${mid(3) + 178},318 ${mid(3) + 150},332" fill="#b3e621"/>${dots}</g>
<path d="M${mid(3)} 902 V958 H${mid(0)} V902" stroke="#f4f4f2" stroke-width="2" stroke-dasharray="3 9" fill="none" opacity=".75"/><polygon points="${mid(0) - 10},916 ${mid(0)},898 ${mid(0) + 10},916" fill="#f4f4f2" opacity=".85"/>
${journey.map((_, i) => `<path d="M${mid(i)} 470 V520 M${mid(i)} 700 V738" stroke="rgba(255,255,255,.4)" stroke-width="2" stroke-dasharray="2 7"/>`).join('')}</svg>
<div class="maphead"><div class="k">The customer journey, behind the scenes</div><div class="t" style="font-size:84px">One customer, four agents</div></div>
<div class="jl" style="top:372px">The customer</div><div class="jl" style="top:580px">Behind the scenes</div><div class="jl" style="top:790px">What it is fed</div>
${col('jtop', (j, i) => `<span>${i + 1} · ${j[0]}</span><h5>${j[1]}</h5>`)}
${col('jag', (j) => `<div class="agi">${bot}</div><div><h5>${j[2]}</h5><p>${j[3]}</p></div>`)}
${col('jin', (j) => `<p>${j[4]}</p>`)}
<div class="jback">What the Analyst learns goes back to the Studio</div>`;
};
const journeyCss = `
.jl{position:absolute;left:112px;width:200px;font:800 19px/1.3 Inter;letter-spacing:.14em;text-transform:uppercase;color:#9b9d96}
.jc{position:absolute;width:356px}
.jtop{top:348px;height:122px;text-align:center;padding:0 14px}
.jtop span{font:800 17px Inter;letter-spacing:.14em;text-transform:uppercase;color:#b3e621}
.jtop h5{font:italic 900 32px/1.1 Playfair;color:#f4f4f2;margin-top:8px}
.jag{top:520px;height:180px;display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:26px;background:#0b0b0b;border:1.5px solid rgba(255,255,255,.7)}
.jag h5{font:italic 900 34px/1.05 Playfair;color:#f4f4f2;margin-bottom:5px}
.jag p{font:500 20px/1.25 Inter;color:#d9dbd4}
.jin{top:738px;height:164px;display:grid;place-items:center;text-align:center;padding:10px 20px;border-radius:20px;border:1.5px dashed rgba(255,255,255,.32)}
.jin p{font:500 23px/1.3 Inter;color:#f4f4f2}
.jback{position:absolute;left:330px;width:1472px;top:968px;text-align:center;font:800 18px Inter;letter-spacing:.14em;text-transform:uppercase;color:#d9dbd4}
`;

/* ---------- three levels ---------- */
const levels = ({ img }) => `
<img src="${img('03-levels.jpg')}" style="position:absolute;left:240px;top:104px;width:1440px;-webkit-mask-image:radial-gradient(ellipse 62% 62% at 50% 50%,#000 70%,transparent 100%)">
<div class="txt" style="left:0;right:0;top:70px;align-items:center;gap:10px"><div class="k">How far do you let it go?</div><div class="t" style="font-size:92px">Three levels of AI</div></div>
${[[499, 'Chatbot', 'You ask. It answers.', 'You are the operator'], [915, 'Agent', 'You delegate. It delivers.', 'You are the manager'], [1388, 'System', 'You design. It runs.', 'You are the architect']].map(([x, h, a, b], i) => `
<div class="cap" style="left:${x}px"><span>Level ${i + 1}</span><h5 class="${i === 2 ? 'hot' : ''}">${h}</h5><p>${a}</p><em>${b}</em></div>`).join('')}`;
const levelsCss = `
.cap{position:absolute;top:806px;transform:translateX(-50%);width:400px;text-align:center}
.cap span{font:800 21px Inter;letter-spacing:.18em;text-transform:uppercase;color:#c9cbc4}
.cap h5{font:italic 900 54px/1.05 Playfair;color:#f4f4f2;margin:4px 0 8px}
.cap h5.hot{color:#b3e621;text-shadow:0 0 30px rgba(179,230,33,.5)}
.cap p{font:500 29px Inter;color:#f4f4f2}
.cap em{display:block;font:800 22px Inter;letter-spacing:.1em;text-transform:uppercase;margin-top:9px}
`;

export const slides = [
  { img: '01a-cover-conductor.jpg', imgStyle: 'transform:translateX(150px)', fade: 42, w: 820, k: 'Marketing in the era of', t: 'Artificial<br>Intelligence', ts: 138,
    sub: 'From a chatbot that answers to a system that runs while you sleep.' },

  { img: '02a-hook-shadow.jpg', k: 'Your next competitor is not a bigger company', t: '3 people.<br>30 agents.', ts: 150,
    sub: 'They publish every day. They test every idea. They never sleep.' },

  { raw: levels, css: levelsCss },

  { img: '04b-wheel.jpg', imgStyle: 'transform:translateX(110px)', k: 'Marketing without AI', t: 'A headcount<br>game', ts: 138,
    sub: 'More channels. More people. More hours. More cost.' },

  { raw: map(false), css: mapCss },
  { raw: loop, css: loopCss },
  { raw: journeySlide, css: journeyCss },

  { img: '07-ouroboros.jpg', imgStyle: 'transform:translateX(150px)', k: 'Organic · SEO', t: 'The machine that<br>feeds itself', ts: 94, w: 900,
    html: list([['1', 'Your customers type their questions'], ['2', 'An agent spots the ones you never answered'], ['3', 'An agent writes, with <em>your</em> expertise'], ['4', 'It publishes and links the pages'], ['5', 'New traffic brings new questions']]) },

  { img: '08-conveyor.jpg', imgStyle: 'transform:translateX(110px)', k: 'Content and media buying', t: 'The content<br>factory', ts: 116, w: 800,
    html: `<div class="cols"><div><h4>Faceless and AI avatar</h4><p>Idea from trends<br>Script in your voice<br>Voice and avatar<br>Edit, captions, formats<br>Schedule and measure</p></div><div><h4>Media buying</h4><p>Angles from intel<br>20 creatives<br>Launch<br>Watch 24/7<br>Kill or scale</p></div></div><div class="rule">Signal. Agent. Action. Feedback.</div>` },

  { img: '09r-domino.jpg', fade: 30, k: 'Easy wins · your first 30 days', t: 'Push the first<br>domino', ts: 100, w: 700,
    html: list([['Day 1', '<em>Brand brain.</em> Offer, customers, tone, best posts: one document.'], ['Week 1', '<em>Multiply content.</em> One video becomes clips, captions, emails.'], ['Week 2', '<em>Answer instantly.</em> Drafted replies to every DM. You approve.'], ['Week 3', '<em>Automatic report.</em> Every Monday: what worked, what broke.']]) + `<div class="rule">One task. One agent. One metric.</div>` },

  { img: '10a-owl.jpg', k: 'Analytics · monitoring · alerts', t: 'Your analyst<br>never sleeps', ts: 128,
    sub: 'AI is not only your hands. It is your <em>eyes</em>: reports, anomalies and alerts, live.' },

  { img: '11-night.jpg', fade: 22, k: 'While you sleep', t: 'It already<br>fixed it', ts: 132, w: 780,
    html: `<div class="log"><div><i>03:12</i>Cost per order up 38% vs the 7-day average</div><div><i>03:13</i>Cause found: one ad set, one broken page</div><div><i>03:14</i>Ad set paused. Budget moved.</div><div><i>08:00</i>Report waiting in your inbox</div></div><div class="tag">Example scenario</div>` },

  { img: '01b-cover-switchboard.jpg', imgStyle: 'transform:translateX(120px)', fade: 22, k: 'How? Give it touchpoints', t: 'Eyes first,<br>hands later', ts: 96, w: 600,
    html: `<div class="cols"><div><h4>Plug in</h4><p>Ad accounts<br>Analytics<br>Search Console<br>Orders and CRM<br>Comments and inbox</p></div><div><h4>What you get</h4><p>Live dashboards<br>Daily briefs<br>Alerts<br>Actions</p></div></div>` },

  { img: '13-fingerprint.jpg', imgStyle: 'transform:translateX(120px)', fade: 42, k: 'The role of the human', t: 'Experience<br>has never been<br>so valuable', ts: 112,
    sub: 'Everyone has the same AI. Nobody has <em>your method</em>.' },

  { img: '14r-stream.jpg', k: 'La matérialisation de l&#39;expertise', t: 'Clone your<br>method', ts: 124, w: 640,
    html: list([['1', 'Pick a result you get every time'], ['2', 'Write the steps as if you were training a junior'], ['3', 'Show good and bad examples'], ['4', 'Give it your tools and your data'], ['5', 'Correct it. Every correction becomes a rule.']]) },

  { img: '14b-mirror.jpg', imgStyle: 'transform:translateX(30px)', fade: 22, k: 'The big goal', t: 'Not replaced.<br>Multiplied.', ts: 94, w: 610,
    sub: 'Build a system that helps you grow faster. Not a machine that takes your seat.' },

  { img: '17b-key.jpg', k: 'Stable for a few months?', t: 'The next level<br>opens', ts: 120,
    sub: 'Clean history, live data, one place. That is real <em>business intelligence</em>.' },

  { img: '16a-cake.jpg', k: 'Layer by layer', t: 'The cherry<br>on top', ts: 128, w: 820,
    html: list([['4', '<em>Prediction.</em> It sees opportunities before you do.'], ['3', '<em>Business intelligence.</em> It understands your business.'], ['2', '<em>Monitoring.</em> Agents watch the numbers.'], ['1', '<em>Execution.</em> Agents do the work.']]) },

  { img: '18r-telescope.jpg', k: 'Aide à la décision', t: 'It sees what<br>you can&#39;t', ts: 128,
    sub: 'Opportunities spotted in real time. You still make the call.' },

  { img: '17a-baton.jpg', top: 150, shade: 'radial-gradient(ellipse 60% 62% at 12% 22%,rgba(3,3,3,.94) 0%,rgba(3,3,3,.8) 55%,rgba(3,3,3,0) 100%)', k: 'Start small. Start tomorrow.', t: 'One task.<br>One agent.', ts: 150,
    sub: 'Pick it tonight. Hand it over tomorrow morning.' },
];
