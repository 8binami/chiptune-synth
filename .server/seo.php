<?php
/**
 * ChiptuneSynth — SEO Meta Injection (server-only)
 * Runs AFTER translation so og:title/og:description reflect the current language.
 *
 * Expects (from index.php scope):
 *   $html          string  — already-translated HTML
 *   $currentLang   string  — e.g. 'zh'
 *   $siteUrl       string  — 'https://chiptune-synth.8binami.com'
 *   $canonicalPath string  — '' for home, 'examples/basic' for sub-pages
 *   $i18nConfig    array   — from i18n.config.php
 */

$canonicalUrl = $siteUrl . '/' . $currentLang . '/' . $canonicalPath;
$ogImage      = 'https://8binami.com/img/og-chiptune-synth.png';
$ogLocale     = $i18nConfig['lang_og_locale'][$currentLang] ?? 'en_US';

// ── Extract translated title & description from the already-translated HTML ──
preg_match('/<title>([^<]+)<\/title>/i', $html, $titleMatch);
$pageTitle = html_entity_decode(trim($titleMatch[1] ?? 'ChiptuneSynth — 8-Bit Synthesizer Library'));

preg_match('/<meta\s+name="description"\s+content="([^"]+)"/i', $html, $descMatch);
$pageDesc = html_entity_decode(trim($descMatch[1] ?? ''));

// ── Build all SEO tags ────────────────────────────────────────────────────────
$seoTags = '';

// Favicon — SVG inline data URI (no external file required)
$faviconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
    . '<rect width="32" height="32" rx="6" fill="#0a0a0f"/>'
    . '<text x="16" y="23" font-size="20" text-anchor="middle" font-family="monospace" fill="#00f0ff">♪</text>'
    . '</svg>';
$faviconUri = 'data:image/svg+xml,' . rawurlencode($faviconSvg);
$seoTags .= '<link rel="icon" type="image/svg+xml" href="' . $faviconUri . '">' . "\n";
$seoTags .= '<link rel="apple-touch-icon" href="' . BASE_URL . '/ico.svg">' . "\n";

// Canonical
$seoTags .= '<link rel="canonical" href="' . htmlspecialchars($canonicalUrl) . '">' . "\n";

// hreflang — standard <link> tags (NOT <xhtml:link>), BCP47 codes
foreach ($i18nConfig['supported_langs'] as $hl) {
    $hlCode = $i18nConfig['lang_hreflang'][$hl] ?? $hl;   // e.g. 'zh-Hans', 'en-US'
    $hlUrl  = $siteUrl . '/' . $hl . '/' . $canonicalPath;
    $seoTags .= '<link rel="alternate" hreflang="' . $hlCode . '" href="' . htmlspecialchars($hlUrl) . '">' . "\n";
}
// x-default → English
$seoTags .= '<link rel="alternate" hreflang="x-default" href="' . htmlspecialchars($siteUrl . '/en/' . $canonicalPath) . '">' . "\n";

// Open Graph
$seoTags .= '<meta property="og:type"        content="website">' . "\n";
$seoTags .= '<meta property="og:url"         content="' . htmlspecialchars($canonicalUrl) . '">' . "\n";
$seoTags .= '<meta property="og:title"       content="' . htmlspecialchars($pageTitle) . '">' . "\n";
$seoTags .= '<meta property="og:description" content="' . htmlspecialchars($pageDesc) . '">' . "\n";
$seoTags .= '<meta property="og:image"       content="' . $ogImage . '">' . "\n";
$seoTags .= '<meta property="og:locale"      content="' . $ogLocale . '">' . "\n";
$seoTags .= '<meta property="og:site_name"   content="8Binami">' . "\n";

// Twitter / X
$seoTags .= '<meta name="twitter:card"        content="summary_large_image">' . "\n";
$seoTags .= '<meta name="twitter:site"        content="@8binami">' . "\n";
$seoTags .= '<meta name="twitter:title"       content="' . htmlspecialchars($pageTitle) . '">' . "\n";
$seoTags .= '<meta name="twitter:description" content="' . htmlspecialchars($pageDesc) . '">' . "\n";
$seoTags .= '<meta name="twitter:image"       content="' . $ogImage . '">' . "\n";

// Language-switcher CSS (inlined, no extra request)
$seoTags .= '<style>'
    . '.lang-switcher{position:relative;margin-left:8px}'
    . '#langToggle{display:none}'
    . '.lang-switcher-btn{display:flex;align-items:center;gap:6px;padding:6px 10px;font-size:.75rem;font-weight:600;color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.15);border-radius:6px;cursor:pointer;transition:all .2s;background:transparent;text-decoration:none}'
    . '.lang-switcher-btn:hover{border-color:#00f0ff;color:#00f0ff}'
    . '.lang-switcher-btn svg{width:16px;height:16px}'
    . '.lang-switcher-dropdown{display:none;position:absolute;top:calc(100% + 8px);right:0;background:#1a1a2e;border:1px solid rgba(255,255,255,.15);border-radius:6px;overflow:hidden;min-width:130px;box-shadow:0 12px 40px rgba(0,0,0,.5);z-index:9999}'
    . '#langToggle:checked~.lang-switcher-dropdown{display:block}'
    . '.lang-switcher-dropdown a{display:block;padding:10px 16px;font-size:.8rem;color:rgba(255,255,255,.6);transition:all .15s;text-decoration:none}'
    . '.lang-switcher-dropdown a:hover,.lang-switcher-dropdown a.active{background:rgba(0,240,255,.1);color:#00f0ff}'
    . '</style>' . "\n";

// Language-switcher close-on-outside-click JS
$seoTags .= '<script>document.addEventListener("click",function(e){var t=document.getElementById("langToggle");if(t&&t.checked&&!e.target.closest(".lang-switcher"))t.checked=false});</script>' . "\n";

// ── Inject before </head> ────────────────────────────────────────────────────
$html = str_replace('</head>', $seoTags . '</head>', $html);

// ── Set lang attribute on <html> ─────────────────────────────────────────────
$html = preg_replace('/<html([^>]*)lang="[^"]*"/', '<html$1lang="' . $currentLang . '"', $html);
if (stripos($html, '<html') !== false && stripos($html, 'lang=') === false) {
    $html = preg_replace('/<html/', '<html lang="' . $currentLang . '"', $html);
}
