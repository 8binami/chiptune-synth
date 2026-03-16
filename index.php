<?php
/**
 * ChiptuneSynth — Front Controller
 * Inspired by 8BitForge controller pattern.
 *
 * Routes all requests through a single entry point.
 * Injects shared PHP nav into every page automatically.
 */

// ── Preprod Gate (dev only) ──────────────────────────────
$preprodGate = __DIR__ . '/../_preprod_gate.php';
if (file_exists($preprodGate)) {
    require_once($preprodGate);
}

// ── Constants ──────────────────────────────────────────
define('ROOT_DIR', __DIR__);

// Compute BASE_URL dynamically (handles XAMPP subfolder)
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
$baseUrl = rtrim($scriptDir, '/');
define('BASE_URL', $baseUrl);

// ── Routing ────────────────────────────────────────────
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);

// Strip base directory from path
if (strpos($path, $baseUrl) === 0) {
    $path = substr($path, strlen($baseUrl));
}
$path = trim($path, '/');

// ── Route matching ─────────────────────────────────────
// Clean URLs:  /examples/basic  (no .html)
// Legacy URLs: /examples/basic.html  (still supported)
// Direct:      /index.php, /index.html, /

if ($path === '' || $path === 'index' || $path === 'index.html' || $path === 'index.php') {
    // Home page
    $fileToInclude = ROOT_DIR . '/index.html';
    $currentPage = 'index';

} elseif (preg_match('#^examples/([a-z0-9\-]+)$#', $path, $m)) {
    // Clean URL: /examples/basic
    $fileToInclude = ROOT_DIR . '/examples/' . $m[1] . '.html';
    $currentPage = $m[1];

} elseif (preg_match('#^examples/([a-z0-9\-]+)\.html$#', $path, $m)) {
    // Legacy .html URL → redirect to clean URL
    header('Location: ' . BASE_URL . '/examples/' . $m[1], true, 301);
    exit;

} else {
    // Try as direct file (for src/*, assets, etc.)
    $directFile = ROOT_DIR . '/' . $path;
    if (file_exists($directFile) && is_file($directFile)) {
        return false; // Let Apache serve static files
    }
    // 404
    header("HTTP/1.0 404 Not Found");
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>404</title>';
    echo '<style>body{background:#0a0a0f;color:#e0e0e0;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}';
    echo '.c{text-align:center}.c h1{font-size:4rem;color:#00f0ff;margin:0}.c p{color:#888}.c a{color:#a855f7}</style>';
    echo '</head><body><div class="c"><h1>404</h1><p>Page not found</p><p><a href="' . BASE_URL . '/">Back to demo</a></p></div></body></html>';
    exit;
}

// ── Security: check file exists ────────────────────────
if (!file_exists($fileToInclude)) {
    header("HTTP/1.0 404 Not Found");
    echo "<h1>404 — Page not found</h1>";
    exit;
}

// ── Build navigation HTML ──────────────────────────────
ob_start();
include ROOT_DIR . '/.php/nav.php';
$navHtml = ob_get_clean();

// ── Render page ────────────────────────────────────────
$html = file_get_contents($fileToInclude);

// Inject nav right after <body...>
$html = preg_replace('#(<body[^>]*>)#i', '$1' . "\n" . $navHtml, $html);

// Inject nav.css in <head> if not already present
if (stripos($html, 'nav.css') === false) {
    $navCssTag = '<link rel="stylesheet" href="' . BASE_URL . '/src/nav.css?v=' . filemtime(ROOT_DIR . '/src/nav.css') . '">';
    $html = str_replace('</head>', $navCssTag . "\n" . '</head>', $html);
}

// ── Analytics (server-side only, not in repo) ─────────
$matomoSiteId = '3';
$matomoFile = __DIR__ . '/../_matomo.php';
if (file_exists($matomoFile)) {
    include $matomoFile;
}

echo $html;
