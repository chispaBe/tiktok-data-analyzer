let data = [];

document.getElementById('fileInput').addEventListener('change', handleFile);
document.getElementById('searchInput').addEventListener('input', render);
document.getElementById('fromDate').addEventListener('change', render);
document.getElementById('toDate').addEventListener('change', render);

function handleFile(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    if (file.name.endsWith('.json')) {
      parseJSON(JSON.parse(reader.result));
    } else {
      parseCSV(reader.result);
    }
    render();
  };

  reader.readAsText(file);
}

function parseCSV(text) {
  const lines = text.split('\n');
  const headers = lines.shift().split(',');

  lines.forEach(line => {
    const values = line.split(',');
    let obj = {};
    headers.forEach((h, i) => obj[h.trim()] = values[i]);
    normalize(obj);
  });
}

function parseJSON(json) {
  json.forEach(normalize);
}

function normalize(row) {
  const url = row.url || row.link || '';
  const isTikTok = url.includes('tiktok.com');

  const videoId = isTikTok ? url.match(/video\/(\d+)/)?.[1] : null;

  data.push({
    timestamp: row.timestamp || row.time || '',
    app: isTikTok ? 'TikTok' : 'Other',
    type: row.search ? 'search' : videoId ? 'video' : 'visit',
    title: row.title || '',
    username: row.username || '',
    url,
    videoId,
    thumbnail: videoId
      ? `https://www.tiktok.com/api/img/?itemId=${videoId}`
      : ''
  });
}
