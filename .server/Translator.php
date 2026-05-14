<?php
/**
 * ChiptuneSynth — Static Translator
 * Applies translations from translations.json directly onto the processed HTML.
 * No API calls, no full-page cache files — translations.json is permanent.
 */
class Translator
{
    private array $translations = [];
    private string $langDir    = '';

    public function __construct(array $config)
    {
        // Translations are split into one file per language under lang/{lang}.json
        $this->langDir = __DIR__ . '/lang';
    }

    private function loadLang(string $lang): void
    {
        if (isset($this->translations[$lang])) return;
        $file = $this->langDir . '/' . $lang . '.json';
        if (file_exists($file)) {
            $this->translations[$lang] = json_decode(file_get_contents($file), true) ?: [];
        }
    }

    /**
     * Translate the processed HTML for the given language.
     * Protects <script>, <style>, <pre>, <code> and translate="no" blocks.
     * Applies str_replace from longest string to shortest to avoid partial matches.
     */
    public function translate(string $html, string $lang): string
    {
        if ($lang === 'en') return $html;

        $this->loadLang($lang);

        if (empty($this->translations[$lang])) {
            return $html;
        }

        $langMap = $this->translations[$lang];

        // ── Protect blocks that must NOT be translated ────────────────────────
        $protected = [];
        $counter   = 0;

        // Helper: protect every occurrence of <tag...>...</tag> using fast string search
        $protectTag = function (string &$html, string $tag) use (&$protected, &$counter): void {
            $open  = '<' . $tag;
            $close = '</' . $tag . '>';
            $offset = 0;
            while (($start = stripos($html, $open, $offset)) !== false) {
                // Find end of opening tag
                $gtPos = strpos($html, '>', $start);
                if ($gtPos === false) break;
                // Find matching closing tag
                $end = stripos($html, $close, $gtPos);
                if ($end === false) break;
                $end += strlen($close);
                $block = substr($html, $start, $end - $start);
                $id    = '__PB' . $counter++ . '__';
                $protected[$id] = $block;
                $html   = substr($html, 0, $start) . $id . substr($html, $end);
                $offset = $start + strlen($id);
            }
        };

        // 1. Protect translate="no" elements (simple attribute scan)
        $html = preg_replace_callback(
            '/<([a-z][a-z0-9]*)\b[^>]*\btranslate="no"[^>]*>/i',
            function ($m) use (&$html, &$protected, &$counter, &$protectTag) {
                // Only protect the opening tag content for now via string approach below
                return $m[0]; // no-op, handled by tag protector
            },
            $html
        );
        // Protect translate="no" blocks via attribute search
        $offset = 0;
        while (($pos = stripos($html, 'translate="no"', $offset)) !== false) {
            // Walk back to find the opening < of this tag
            $tagStart = strrpos($html, '<', -(strlen($html) - $pos));
            if ($tagStart === false) { $offset = $pos + 1; continue; }
            // Extract tag name
            if (!preg_match('/^<([a-z][a-z0-9]*)/i', substr($html, $tagStart, 20), $tm)) {
                $offset = $pos + 1; continue;
            }
            $tagName = strtolower($tm[1]);
            $closeTag = '</' . $tagName . '>';
            $gtPos = strpos($html, '>', $tagStart);
            if ($gtPos === false) { $offset = $pos + 1; continue; }
            $end = stripos($html, $closeTag, $gtPos);
            if ($end === false) { $offset = $pos + 1; continue; }
            $end += strlen($closeTag);
            $block = substr($html, $tagStart, $end - $tagStart);
            $id = '__PB' . $counter++ . '__';
            $protected[$id] = $block;
            $html   = substr($html, 0, $tagStart) . $id . substr($html, $end);
            $offset = $tagStart + strlen($id);
        }

        // 2. Protect script / style / pre / code blocks
        foreach (['script', 'style', 'pre', 'code'] as $tag) {
            $protectTag($html, $tag);
        }

        // ── Apply translations (longest first) ────────────────────────────────
        uksort($langMap, fn($a, $b) => strlen($b) - strlen($a));

        $search  = array_keys($langMap);
        $replace = array_values($langMap);

        // Tag-aware translation: split into HTML tags and text nodes,
        // translate ONLY text nodes — this protects id/class/data-* attributes.
        // preg_split with PREG_SPLIT_DELIM_CAPTURE gives alternating segments:
        //   even indices (0,2,4…) = text nodes   → translate
        //   odd  indices (1,3,5…) = <tag…> chunks → preserve as-is
        $segments = preg_split('/(<[^>]*>)/s', $html, -1, PREG_SPLIT_DELIM_CAPTURE);
        $html = '';
        foreach ($segments as $i => $seg) {
            $html .= ($i % 2 === 0)
                ? str_replace($search, $replace, $seg)   // text node
                : $seg;                                   // HTML tag — untouched
        }

        // ── Restore protected blocks ──────────────────────────────────────────
        foreach ($protected as $id => $original) {
            $html = str_replace($id, $original, $html);
        }

        return $html;
    }

    /**
     * Always false — no API calls, no failures.
     */
    public function hasFailed(): bool
    {
        return false;
    }
}
