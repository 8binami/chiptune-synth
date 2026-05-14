<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Get CodePen IDs — 8binami</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: #0a0a0f; color: #ccc; padding: 48px 24px; max-width: 680px; margin: 0 auto; }
  h1   { color: #00f0ff; font-size: 1.3rem; margin-bottom: 6px; }
  p    { color: #888; font-size: 13px; margin-bottom: 32px; line-height: 1.6; }

  .step { margin-bottom: 36px; }
  .step h2 { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 12px; letter-spacing: .5px; text-transform: uppercase; }

  /* Bookmarklet drag zone */
  .bm-wrap { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .bm-link {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, #00f0ff, #a855f7);
    color: #000; font-weight: 700; font-size: 13px;
    padding: 10px 20px; border-radius: 8px; text-decoration: none;
    cursor: grab; white-space: nowrap; user-select: none;
  }
  .bm-hint { color: #555; font-size: 12px; }

  /* Output */
  #output {
    background: #111; border: 1px solid #222; border-radius: 8px;
    padding: 20px; white-space: pre; font-family: monospace; font-size: 13px;
    line-height: 1.7; color: #4ade80; min-height: 80px; overflow: auto;
  }
  #output.empty { color: #333; font-style: italic; }

  button {
    padding: 8px 18px; border: none; border-radius: 6px;
    font-weight: 700; font-size: 12px; cursor: pointer; transition: opacity .15s;
  }
  button:hover { opacity: .85; }
  #btnCopy { background: #a855f7; color: #fff; }
  #btnClear { background: #222; color: #888; margin-left: 8px; }

  .tag { background: rgba(0,240,255,.08); border: 1px solid rgba(0,240,255,.2); border-radius: 4px; padding: 2px 6px; font-size: 11px; color: #00f0ff; }
  hr { border: none; border-top: 1px solid #1a1a1a; margin: 32px 0; }
</style>
</head>
<body>

<h1>🎵 Récupérer tes IDs CodePen</h1>
<p>Cloudflare bloque les requêtes serveur vers CodePen. La solution la plus simple : un bookmarklet qui s'exécute directement sur ta page CodePen.</p>

<div class="step">
  <h2>① Glisse ce bouton dans ta barre de favoris</h2>
  <div class="bm-wrap">
    <a class="bm-link" id="bm" href="#">🎵 Get Pen IDs</a>
    <span class="bm-hint">← glisse-dépose dans la barre de favoris de ton navigateur</span>
  </div>
</div>

<div class="step">
  <h2>② Va sur ta page CodePen</h2>
  <p style="margin-bottom:0;">
    Ouvre <a href="https://codepen.io/8binami/pens/public" target="_blank" style="color:#00f0ff;">codepen.io/8binami/pens/public</a>
    puis clique sur le favori <span class="tag">🎵 Get Pen IDs</span><br>
    Le tableau s'affiche ici automatiquement.
  </p>
</div>

<div class="step">
  <h2>③ Résultat</h2>
  <div id="output" class="empty">En attente… (clique le bookmarklet sur ta page CodePen)</div>
  <div style="margin-top:12px;">
    <button id="btnCopy" onclick="copyOut()">⎘ Copier</button>
    <button id="btnClear" onclick="clearOut()">✕ Effacer</button>
  </div>
</div>

<hr>

<div class="step">
  <h2>Alternative — Colle ton flux RSS ici</h2>
  <p style="margin-bottom:8px;">
    Ouvre <a href="https://codepen.io/8binami/public/feed/" target="_blank" style="color:#00f0ff;">codepen.io/8binami/public/feed/</a>
    dans ton navigateur, sélectionne tout (<kbd>Ctrl+A</kbd>), copie et colle ci-dessous.
  </p>
  <textarea id="rssInput" placeholder="Colle le XML du flux RSS ici…"
    style="width:100%;height:120px;background:#111;border:1px solid #222;border-radius:8px;padding:12px;color:#ccc;font-family:monospace;font-size:12px;resize:vertical;"></textarea>
  <button onclick="parseRss()" style="background:#00f0ff;color:#000;margin-top:8px;">⚙ Parser</button>
</div>

<script>
/* ── Bookmarklet code ─────────────────────────────────── */
var bmCode = `javascript:(function(){
  var ids=[];
  document.querySelectorAll('a[href*="/pen/"]').forEach(function(a){
    var m=a.href.match(/codepen\\.io\\/[^/]+\\/pen\\/([A-Za-z0-9]+)/);
    if(m&&!ids.includes(m[1]))ids.push(m[1]);
  });
  if(!ids.length){alert('Aucun pen trouvé sur cette page.');return;}
  var code='const PENS = [\\n'+ids.map(function(id){return "    '"+id+"',"}).join('\\n')+'\\n];';
  var ch=new BroadcastChannel('cp_pens');ch.postMessage(code);ch.close();
  alert('✅ '+ids.length+' pens trouvés — retourne sur fetch_pens.php pour voir le résultat.');
})();`;

document.getElementById('bm').href = bmCode;

/* ── Listen for bookmarklet message ──────────────────── */
var ch = new BroadcastChannel('cp_pens');
ch.onmessage = function(e) {
  var out = document.getElementById('output');
  out.textContent = e.data;
  out.classList.remove('empty');
};

/* ── Parse pasted RSS XML ─────────────────────────────── */
function parseRss() {
  var raw = document.getElementById('rssInput').value.trim();
  if (!raw) return;
  try {
    var xml   = new DOMParser().parseFromString(raw, 'text/xml');
    var items = Array.from(xml.querySelectorAll('item'));
    var ids   = [];
    items.forEach(function(item) {
      var link = item.querySelector('link')?.textContent?.trim() || '';
      var m    = link.match(/codepen\.io\/[^/]+\/pen\/([A-Za-z0-9]+)/);
      if (m && !ids.includes(m[1])) ids.push(m[1]);
    });
    if (!ids.length) { alert('Aucun ID trouvé dans ce XML.'); return; }
    var code = 'const PENS = [\n' + ids.map(function(id){ return "    '" + id + "',"; }).join('\n') + '\n];';
    var out = document.getElementById('output');
    out.textContent = code;
    out.classList.remove('empty');
  } catch(e) {
    alert('Erreur de parsing : ' + e.message);
  }
}

/* ── Copy / Clear ─────────────────────────────────────── */
function copyOut() {
  var text = document.getElementById('output').textContent;
  if (!text || document.getElementById('output').classList.contains('empty')) return;
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.getElementById('btnCopy');
    btn.textContent = '✓ Copié !';
    setTimeout(function(){ btn.textContent = '⎘ Copier'; }, 2000);
  });
}
function clearOut() {
  var out = document.getElementById('output');
  out.textContent = 'En attente…';
  out.classList.add('empty');
}
</script>
</body>
</html>
