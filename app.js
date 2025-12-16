let data = [];

const fileInput = document.getElementById('fileInput');
const searchInput = document.getElementById('searchInput');
const fromDate = document.getElementById('fromDate');
const toDate = document.getElementById('toDate');
const tbody = document.getElementById('tableBody');

fileInput.addEventListener('change', handleFile);
searchInput.addEventListener('input', render);
fromDate.addEventListener('change', render);
toDate.addEventListener('change', render);

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => parseFile(file.name, reader.result);
  reader.readAsText(file);
}

async function parseFile(name, text) {
  data = [];

  if (name.endsWith('.json')) {
    const json = JSON.parse(text);
    for (const row of json) {
      await normalize(row);
    }
  } 
  else if (name.endsWith('.csv')) {
    parseCSV(text);
  } 
  else {
    parseTXT(text);
  }

  render();
}

/* ---------- PARSERS ---------- */

function parseCSV(text) {
  const lines = text.split('\n');
  const headers = lines.shift().split(',');

  lines.forEach(line => {
    if (!line.trim()) return;
    const values = line.split(',');
    let row = {};
    headers.forEach((h, i) => row[h.trim()] = values[i]);
    normalize(row);
  });
}

function parseTXT(text) {
  const lines = text.split('\n');

  lines.forEach(line => {
    const match = line.match(/https?:\/\/www\.tiktok\.com\/[^\s]+/);
    if (!match) return;

    normalize({
      timestamp: extractDate(line),
      url: match[0]
    });
  });
}

function extractDate(line) {
  const m = line.match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : '';
}

/* ---------- NORMALIZE ---------- */

async function normalize(row) {
  const url = row.url || row.link || '';
  if (!url.includes('tiktok.com')) return;

  const videoId = url.match(/video\/(\d+)/)?.[1];

  const item = {
    timestamp: row.timestamp || '',
    app: 'TikTok',
    type: 'video',
    title: '',
    username: '',
    url,
    videoId,
    thumbnail: '',
    status: '⏳'
  };

  data.push(item);

  if (videoId) {
    await checkTikTokStatus(item);
  }
}

/* ---------- TIKTOK STATUS ---------- */

async function checkTikTokStatus(item) {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(item.url)}`
    );

    if (!res.ok) {
      item.status = '❌ Borrado';
      return;
    }

    const d = await res.json();
    item.title = d.title || '';
    item.username = d.author_name || '';
    item.thumbnail = d.thumbnail_url || '';
    item.status = '✅ Activo';

  } catch {
    item.status = '❌ Borrado';
  }
}

/* ---------- RENDER ---------- */

function render() {
  tbody.innerHTML = '';

  const q = searchInput.value.toLowerCase();
  const from = fromDate.value;
  const to = toDate.value;

  data
    .filter(d =>
      (!q || JSON.stringify(d).toLowerCase().includes(q)) &&
      (!from || d.timestamp >= from) &&
      (!to || d.timestamp <= to)
    )
    .forEach(d => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${d.timestamp}</td>
        <td>${d.type}</td>
        <td>${d.app}</td>
        <td>${d.title || '—'}</td>
        <td>${d.username || '—'}</td>
        <td>${d.status}</td>
        <td><a href="${d.url}" target="_blank">link</a></td>
      `;
      tbody.appendChild(tr);
    });
}
