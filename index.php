<?php
/**
 * ChiptuneSynth — Front Controller
 * Inspired by 8BitForge controller pattern.
 *
 * Routes all requests through a single entry point.
 * Injects shared PHP nav into every page automatically.
 * Conditionally loads i18n/SEO from .server/ (gitignored, server-only).
 */

// ── Constants ──────────────────────────────────────────
define('ROOT_DIR', __DIR__);

// Compute BASE_URL dynamically (handles XAMPP subfolder)
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
$baseUrl = rtrim($scriptDir, '/');

// ── i18n Configuration (server-only) ────────────────────
$serverDir = ROOT_DIR . '/.server';
$hasI18n = file_exists($serverDir . '/i18n.config.php');
$i18nConfig = null;
$supportedLangs = [];
$defaultLang = 'en';
$currentLang = 'en';

if ($hasI18n) {
    $i18nConfig = require($serverDir . '/i18n.config.php');
    $supportedLangs = $i18nConfig['supported_langs'];
    $defaultLang = $i18nConfig['default_lang'];
}

// ── Routing ────────────────────────────────────────────
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);

// Strip base directory from path
if (strpos($path, $baseUrl) === 0) {
    $path = substr($path, strlen($baseUrl));
}
$path = trim($path, '/');

// ── Serve .server/ static files (robots.txt, llms.txt, sitemap) ──
if ($hasI18n) {
    if ($path === 'robots.txt' && file_exists($serverDir . '/robots.txt')) {
        header('Content-Type: text/plain; charset=utf-8');
        readfile($serverDir . '/robots.txt');
        exit;
    }
    if ($path === 'llms.txt' && file_exists($serverDir . '/llms.txt')) {
        header('Content-Type: text/plain; charset=utf-8');
        readfile($serverDir . '/llms.txt');
        exit;
    }
    if ($path === 'sitemap.xml' && file_exists($serverDir . '/sitemap.php')) {
        include $serverDir . '/sitemap.php';
        exit;
    }
}

// ── Extract language prefix from URL ────────────────────
$canonicalPath = '';

if ($hasI18n && !empty($path)) {
    $segments = explode('/', $path, 2);
    if (in_array($segments[0], $supportedLangs, true)) {
        $currentLang = $segments[0];
        $path = $segments[1] ?? '';
    } elseif ($path !== '' && $path !== 'index' && $path !== 'index.html' && $path !== 'index.php'
              && !preg_match('#^(examples|src|assets|ico\.)#', $path)) {
        // Bare page slug without language prefix → redirect to default lang
        header('Location: ' . $baseUrl . '/' . $defaultLang . '/' . $path, true, 301);
        exit;
    }
}

define('BASE_URL', $baseUrl);
define('CURRENT_LANG', $currentLang);

// ── Route matching ─────────────────────────────────────
// Clean URLs:  /examples/basic  (no .html)
// Legacy URLs: /examples/basic.html  (still supported)
// Direct:      /index.php, /index.html, /

if ($path === '' || $path === 'index' || $path === 'index.html' || $path === 'index.php') {
    // Home page
    $fileToInclude = ROOT_DIR . '/index.html';
    $currentPage = 'index';
    $canonicalPath = '';

} elseif (preg_match('#^examples/([a-z0-9\-]+)$#', $path, $m)) {
    // Clean URL: /examples/basic
    $fileToInclude = ROOT_DIR . '/examples/' . $m[1] . '.html';
    $currentPage = $m[1];
    $canonicalPath = 'examples/' . $m[1];

} elseif (preg_match('#^examples/([a-z0-9\-]+)\.html$#', $path, $m)) {
    // Legacy .html URL → redirect to clean URL
    $langPrefix = ($hasI18n) ? '/' . $currentLang : '';
    header('Location: ' . BASE_URL . $langPrefix . '/examples/' . $m[1], true, 301);
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

// ── File cache (server-only) ────────────────────────────
$cacheFile = null;
if ($hasI18n && !empty($i18nConfig['cache_dir'])) {
    $cacheDir = $i18nConfig['cache_dir'];
    $cacheSlug = $currentLang . '_' . ($canonicalPath ? str_replace('/', '_', $canonicalPath) : 'index');
    $cacheFile = $cacheDir . '/' . $cacheSlug . '.html';

    // Invalidate when source HTML, translations, nav or minifier changes
    $sourceFiles = [
        $fileToInclude,
        ROOT_DIR . '/.php/nav.php',
        ROOT_DIR . '/src/nav.css',
        $serverDir . '/Translator.php',
    ];
    // Invalidate cache when any lang file changes
    foreach (glob($serverDir . '/lang/*.json') ?: [] as $lf) {
        $sourceFiles[] = $lf;
    }
    if (file_exists($serverDir . '/HtmlMinifier.php')) {
        $sourceFiles[] = $serverDir . '/HtmlMinifier.php';
    }
    $sourceTime = max(array_map('filemtime', array_filter($sourceFiles, 'file_exists')));

    if (file_exists($cacheFile) && filemtime($cacheFile) >= $sourceTime) {
        // ── Cache HIT ── serve instantly
        $matomoFile = __DIR__ . '/../_matomo.php';
        if (file_exists($matomoFile)) { include $matomoFile; }
        readfile($cacheFile);
        exit;
    }
}

// ── Build navigation HTML ──────────────────────────────
ob_start();
include ROOT_DIR . '/.php/nav.php';
$navHtml = ob_get_clean();

// ── Inject language switcher into nav (server-only) ─────
if ($hasI18n) {
    $currentSlug = $canonicalPath;
    $langSwitcherHtml = '<div class="lang-switcher" translate="no">';
    $langSwitcherHtml .= '<input type="checkbox" id="langToggle">';
    $langSwitcherHtml .= '<label for="langToggle" class="lang-switcher-btn" aria-label="Change language">';
    $langSwitcherHtml .= '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>';
    $langSwitcherHtml .= '<span>' . strtoupper($currentLang) . '</span>';
    $langSwitcherHtml .= '</label>';
    $langSwitcherHtml .= '<div class="lang-switcher-dropdown">';
    foreach ($supportedLangs as $lc) {
        $activeClass = ($lc === $currentLang) ? ' class="active"' : '';
        $switchUrl = $baseUrl . '/' . $lc . '/' . $currentSlug;
        $langSwitcherHtml .= '<a href="' . $switchUrl . '"' . $activeClass . '>' . $i18nConfig['lang_names'][$lc] . '</a>';
    }
    $langSwitcherHtml .= '</div></div>';

    // Insert inside .cs-nav-btns (before its closing </div>)
    // The nav structure is: .cs-topbar > .cs-topbar-inner > [.cs-logo, .cs-nav-links, .cs-nav-btns]
    // We insert the lang switcher right after the npm button's closing </a> tag inside .cs-nav-btns
    $navHtml = preg_replace('#(class="cs-btn cs-btn-npm".*?</a>)\s*(</div>)#s', '$1' . "\n" . '            ' . $langSwitcherHtml . "\n" . '        $2', $navHtml);
}

// ── Render page ────────────────────────────────────────
$html = file_get_contents($fileToInclude);

// Inject nav right after <body...>
$html = preg_replace('#(<body[^>]*>)#i', '$1' . "\n" . $navHtml, $html);

// Inject nav.css in <head> if not already present
if (stripos($html, 'nav.css') === false) {
    $navCssPath = ROOT_DIR . '/src/nav.css';
    $navCssVer  = file_exists($navCssPath) ? filemtime($navCssPath) : '1';
    $navCssTag  = '<link rel="stylesheet" href="' . BASE_URL . '/src/nav.css?v=' . $navCssVer . '">';
    $html = str_replace('</head>', $navCssTag . "\n" . '</head>', $html);
}

// ── Localize Bootstrap (CDN → vendor) ─────────────────────
$html = str_replace(
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    BASE_URL . '/src/vendor/bootstrap.min.css',
    $html
);
$html = str_replace(
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    BASE_URL . '/src/vendor/bootstrap-icons.min.css',
    $html
);
$html = str_replace(
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
    BASE_URL . '/src/vendor/bootstrap.bundle.min.js',
    $html
);

// ── Translation pipeline (non-English, server-only) ─────
if ($hasI18n && $currentLang !== $defaultLang) {
    require_once($serverDir . '/Translator.php');
    $translator = new Translator($i18nConfig);
    $html = $translator->translate($html, $currentLang);
}

// ── SEO injection AFTER translation (og:title/og:description use translated text) ──
if ($hasI18n) {
    $siteUrl = rtrim($i18nConfig['site_url'], '/');
    include $serverDir . '/seo.php';
}

// ── Minify (server-only) ────────────────────────────────
if (file_exists($serverDir . '/HtmlMinifier.php')) {
    require_once($serverDir . '/HtmlMinifier.php');
    $minifier = new HtmlMinifier([
        'minify_inline_js'  => false,
        'remove_js_comments' => false,
    ]);
    $html = $minifier->minify($html);
}

// ── Save to cache ──────────────────────────────────────
if ($cacheFile !== null) {
    $cacheDir = dirname($cacheFile);
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0755, true);
    }
    file_put_contents($cacheFile, $html);
}

// ── Analytics (server-side only, not in repo) ─────────
$matomoSiteId = '3';
$matomoFile = __DIR__ . '/../_matomo.php';
if (file_exists($matomoFile)) {
    include $matomoFile;
}

echo $html;
