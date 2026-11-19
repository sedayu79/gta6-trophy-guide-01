// Leonida Trophy Guide: offline tracker for the 55 GTA VI trophies.
// Loads data/trophies.json and data/roadmap.json from this folder, nothing else.
// Progress lives in localStorage; export and import move it as a JSON file.
const KEY = 'leonida-trophy-guide-v1';
const DEMO_EARNED = [2, 3, 4, 5, 8, 9, 10, 14, 15, 16, 17, 18, 19, 20, 21, 28, 30, 32, 35, 42, 53];

const params = new URLSearchParams(location.search);
const listEl = document.getElementById('trophyList');
const emptyMsg = document.getElementById('emptyMsg');
const listNote = document.getElementById('listNote');
const searchInput = document.getElementById('search');
const gradeSelect = document.getElementById('grade');
const spoilersBox = document.getElementById('spoilers');
const hideEarnedBox = document.getElementById('hideEarned');
const kindButtons = document.getElementById('kindButtons');

let trophies = [];
let roadmap = [];
let earned = new Set();
let kind = 'all';
let openGuides = new Set();

try {
  earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
} catch {
  earned = new Set();
}
if (params.get('demo') === '1') {
  for (const id of DEMO_EARNED) earned.add(id);
}
if (params.get('open')) openGuides.add(Number(params.get('open')));
if (params.get('filter')) kind = params.get('filter');
if (params.get('spoilers') === 'on') spoilersBox.checked = true;

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify([...earned]));
  } catch {
    // storage full or unavailable: progress still works for this visit
  }
}

function kindOf(t) {
  if (kind === 'missable') return t.missable;
  if (kind === 'online') return false;
  if (kind === 'all') return true;
  return t.kind === kind;
}

function visibleName(t) {
  if (spoilersBox.checked && t.hidden && !earned.has(t.id)) return 'Hidden story trophy';
  return t.name;
}

function visibleDesc(t) {
  if (spoilersBox.checked && t.hidden && !earned.has(t.id)) {
    return 'Hidden on PlayStation until earned. Tick it off once you unlock it to reveal its name and description.';
  }
  return t.description;
}

function matches(t) {
  if (!kindOf(t)) return false;
  if (gradeSelect.value !== 'all' && t.grade !== gradeSelect.value) return false;
  if (hideEarnedBox.checked && earned.has(t.id)) return false;
  const q = searchInput.value.trim().toLowerCase();
  if (q) {
    const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.kind).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sourceLinks(t) {
  return t.sources.map((s) => {
    const a = document.createElement('a');
    a.textContent = s.name;
    if (s.url) {
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    return a;
  });
}

function renderGuide(t, card) {
  const guide = document.createElement('div');
  guide.className = 'guide';
  if (t.guide.includes('Unconfirmed') || t.guide.includes('unconfirmed')) {
    const flag = document.createElement('span');
    flag.className = 'unconfirmed';
    flag.textContent = 'Unconfirmed method at launch';
    guide.append(flag);
  }
  const text = document.createElement('p');
  text.textContent = t.guide;
  guide.append(text);
  if (t.steps && t.steps.length) {
    const ol = document.createElement('ol');
    for (const step of t.steps) {
      const li = document.createElement('li');
      li.textContent = step;
      ol.append(li);
    }
    guide.append(ol);
  }
  const src = document.createElement('p');
  src.className = 'sources';
  src.textContent = 'Sources: ';
  const links = sourceLinks(t);
  links.forEach((a, i) => {
    src.append(a);
    if (i < links.length - 1) src.append(document.createTextNode(' · '));
  });
  guide.append(src);
  card.append(guide);
}

function renderList() {
  listEl.replaceChildren();
  const shown = trophies.filter(matches);
  for (const t of shown) {
    const card = document.createElement('article');
    card.className = 'trophy' + (earned.has(t.id) ? ' earned' : '');
    card.dataset.trophyId = String(t.id);
    const head = document.createElement('div');
    head.className = 'trophy-head';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      save();
      renderAll();
    });
    head.append(box);
    const title = document.createElement('div');
    title.className = 'trophy-title';
    const name = document.createElement('div');
    name.className = 'trophy-name' + (spoilersBox.checked && t.hidden && !earned.has(t.id) ? ' spoiler-name' : '');
    name.textContent = visibleName(t);
    title.append(name);
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = visibleDesc(t);
    title.append(desc);
    const badges = document.createElement('div');
    badges.className = 'badges';
    const gradeBadge = document.createElement('span');
    gradeBadge.className = 'badge ' + t.grade;
    gradeBadge.textContent = t.grade;
    badges.append(gradeBadge);
    const kindBadge = document.createElement('span');
    kindBadge.className = 'badge';
    kindBadge.textContent = t.kind;
    badges.append(kindBadge);
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'badge missable';
      m.textContent = 'Missable';
      badges.append(m);
    }
    if (t.hidden) {
      const h = document.createElement('span');
      h.className = 'badge hidden';
      h.textContent = 'Hidden on PSN';
      badges.append(h);
    }
    title.append(badges);
    head.append(title);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'guide-toggle';
    toggle.textContent = openGuides.has(t.id) ? 'Hide guide' : 'Show guide';
    toggle.addEventListener('click', () => {
      if (openGuides.has(t.id)) openGuides.delete(t.id);
      else openGuides.add(t.id);
      renderAll();
    });
    head.append(toggle);
    card.append(head);
    if (openGuides.has(t.id)) renderGuide(t, card);
    listEl.append(card);
  }
  emptyMsg.hidden = shown.length !== 0;
  if (kind === 'online') {
    listNote.textContent = 'No online trophies in GTA VI: all 55 unlock in single-player.';
  } else if (shown.length === 0) {
    listNote.textContent = '';
  } else {
    listNote.textContent = 'Showing ' + shown.length + ' of 55 trophies. Tick a trophy off when you earn it; your progress saves in this browser.';
  }
}

function renderProgress() {
  const total = trophies.length || 55;
  const n = [...earned].filter((id) => trophies.some((t) => t.id === id)).length;
  document.getElementById('earnedCount').textContent = String(n);
  document.getElementById('totalCount').textContent = String(total);
  document.getElementById('earnedPct').textContent = Math.round((n / total) * 100) + '%';
  document.getElementById('miniProgress').textContent = n + ' / ' + total + ' earned · ' + Math.round((n / total) * 100) + '%';
  document.getElementById('barFill').style.width = ((n / total) * 100) + '%';
  const counts = {};
  for (const t of trophies) {
    counts[t.grade] = counts[t.grade] || [0, 0];
    counts[t.grade][1] += 1;
    if (earned.has(t.id)) counts[t.grade][0] += 1;
  }
  document.getElementById('gradeCounts').textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => g.charAt(0).toUpperCase() + g.slice(1) + ' ' + (counts[g] ? counts[g][0] : 0) + '/' + (counts[g] ? counts[g][1] : 0))
    .join(' · ');
  for (const btn of kindButtons.querySelectorAll('.kind')) {
    const k = btn.dataset.kind;
    const nEl = btn.querySelector('.n');
    if (!nEl) continue;
    if (k === 'all') nEl.textContent = '(' + total + ')';
    else if (k === 'missable') nEl.textContent = '(' + trophies.filter((t) => t.missable).length + ')';
    else if (k === 'online') nEl.textContent = '(0)';
    else nEl.textContent = '(' + trophies.filter((t) => t.kind === k).length + ')';
  }
}

function renderRoadmap() {
  const stagesEl = document.getElementById('stages');
  stagesEl.replaceChildren();
  for (const s of roadmap) {
    const inStage = trophies.filter((t) => t.stage === s.stage);
    const earnedInStage = inStage.filter((t) => earned.has(t.id)).length;
    const div = document.createElement('div');
    div.className = 'stage';
    const h = document.createElement('h3');
    const no = document.createElement('span');
    no.className = 'step-no';
    no.textContent = String(s.stage);
    h.append(no, document.createTextNode(s.title));
    div.append(h);
    const p = document.createElement('p');
    p.textContent = s.blurb;
    div.append(p);
    const c = document.createElement('div');
    c.className = 'stage-count';
    c.textContent = earnedInStage + ' / ' + inStage.length + ' trophies earned in this stage';
    div.append(c);
    stagesEl.append(div);
  }
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderList();
}

kindButtons.addEventListener('click', (e) => {
  const btn = e.target.closest('.kind');
  if (!btn) return;
  kind = btn.dataset.kind;
  for (const b of kindButtons.querySelectorAll('.kind')) b.classList.toggle('active', b === btn);
  renderAll();
});
gradeSelect.addEventListener('change', renderAll);
searchInput.addEventListener('input', renderAll);
spoilersBox.addEventListener('change', renderAll);
hideEarnedBox.addEventListener('change', renderAll);

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('bad file');
    earned = new Set(ids.filter((id) => trophies.some((t) => t.id === id)));
    save();
    renderAll();
    document.getElementById('saveNote').textContent = 'Progress imported: ' + earned.size + ' trophies earned.';
  } catch {
    document.getElementById('saveNote').textContent = 'That file could not be imported. It must be a progress file exported from this guide.';
  }
  e.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset all progress? This clears every ticked trophy.')) return;
  earned = new Set();
  save();
  renderAll();
});

// Load the data, then render. The kind buttons start from the ?filter= param.
const [trophyData, roadmapData] = await Promise.all([
  (await fetch('data/trophies.json')).json(),
  (await fetch('data/roadmap.json')).json(),
]);
trophies = trophyData.trophies;
roadmap = roadmapData.stages;
for (const b of kindButtons.querySelectorAll('.kind')) b.classList.toggle('active', b.dataset.kind === kind);
renderAll();
if (params.get('view') === 'roadmap') {
  document.getElementById('roadmapDetails').open = true;
}
