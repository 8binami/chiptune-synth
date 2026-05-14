<?php
/**
 * ChiptuneSynth — Dynamic XML Sitemap Generator
 * Generates sitemap.xml with hreflang (BCP47) for:
 *  - Home page
 *  - Examples pages
 * Served via .htaccess: RewriteRule ^sitemap\.xml$ .server/sitemap.php [L]
 */
header('Content-Type: application/xml; charset=UTF-8');

$config      = require(__DIR__ . '/i18n.config.php');
$siteUrl     = rtrim($config['site_url'], '/');
$langs       = $config['supported_langs'];
$hreflangMap = $config['lang_hreflang'];
$priorities  = $config['sitemap_priority'];
$rootDir     = dirname(__DIR__);

function sitemapLoc(string $siteUrl, string $lang, string $path): string {
    return htmlspecialchars($siteUrl . '/' . $lang . '/' . $path, ENT_XML1);
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

<?php
// ── Home ─────────────────────────────────────────────────────────────────────
$lastmod = date('Y-m-d', filemtime($rootDir . '/index.html'));
foreach ($langs as $lang):
?>
    <url>
        <loc><?= sitemapLoc($siteUrl, $lang, '') ?></loc>
<?php foreach ($langs as $hl): ?>
        <xhtml:link rel="alternate" hreflang="<?= $hreflangMap[$hl] ?? $hl ?>" href="<?= sitemapLoc($siteUrl, $hl, '') ?>"/>
<?php endforeach; ?>
        <xhtml:link rel="alternate" hreflang="x-default" href="<?= sitemapLoc($siteUrl, 'en', '') ?>"/>
        <lastmod><?= $lastmod ?></lastmod>
        <changefreq>monthly</changefreq>
        <priority>1.0</priority>
    </url>
<?php endforeach;

// ── Examples ─────────────────────────────────────────────────────────────────
$examplesDir = $rootDir . '/examples';
if (is_dir($examplesDir)) {
    foreach (glob($examplesDir . '/*.html') as $file) {
        $slug    = basename($file, '.html');
        $lastmod = date('Y-m-d', filemtime($file));
        $priority = $priorities[$slug] ?? '0.6';

        foreach ($langs as $lang):
?>
    <url>
        <loc><?= sitemapLoc($siteUrl, $lang, 'examples/' . $slug) ?></loc>
<?php foreach ($langs as $hl): ?>
        <xhtml:link rel="alternate" hreflang="<?= $hreflangMap[$hl] ?? $hl ?>" href="<?= sitemapLoc($siteUrl, $hl, 'examples/' . $slug) ?>"/>
<?php endforeach; ?>
        <xhtml:link rel="alternate" hreflang="x-default" href="<?= sitemapLoc($siteUrl, 'en', 'examples/' . $slug) ?>"/>
        <lastmod><?= $lastmod ?></lastmod>
        <changefreq>monthly</changefreq>
        <priority><?= $priority ?></priority>
    </url>
<?php
        endforeach;
    }
}
?>
</urlset>
