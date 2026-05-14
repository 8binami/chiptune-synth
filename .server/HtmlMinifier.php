<?php
/**
 * HTML Minifier (server-only)
 */
class HtmlMinifier {

    private $html;
    private $options;

    private $defaultOptions = [
        'remove_comments' => true,
        'remove_js_comments' => true,
        'remove_css_comments' => true,
        'minify_inline_css' => true,
        'minify_inline_js' => true,
        'remove_whitespace' => true,
    ];

    public function __construct($options = []) {
        $this->options = array_merge($this->defaultOptions, $options);
    }

    public function minify($html) {
        $this->html = $html;

        if ($this->options['remove_comments']) {
            $this->removeHtmlComments();
        }

        if ($this->options['remove_css_comments'] || $this->options['minify_inline_css']) {
            $this->processInlineCss();
        }

        if ($this->options['remove_js_comments'] || $this->options['minify_inline_js']) {
            $this->processInlineJs();
        }

        if ($this->options['remove_whitespace']) {
            $this->removeWhitespace();
        }

        return $this->html;
    }

    private function removeHtmlComments() {
        $this->html = preg_replace('/<!--(?!\s*(?:\[if [^\]]+]|<!|>))(?:(?!-->).)*-->/s', '', $this->html);
    }

    private function processInlineCss() {
        $this->html = preg_replace_callback(
            '/<style([^>]*)>(.*?)<\/style>/is',
            function($matches) {
                $attrs = $matches[1];
                $css = $matches[2];

                if ($this->options['remove_css_comments']) {
                    $css = preg_replace('/\/\*.*?\*\//s', '', $css);
                }

                if ($this->options['minify_inline_css']) {
                    $css = preg_replace('/\s*([{}:;,>+~\[\]])\s*/', '$1', $css);
                    $css = preg_replace('/\s+/', ' ', $css);
                    $css = str_replace(';}', '}', $css);
                    $css = str_replace(["\r\n", "\r", "\n"], '', $css);
                    $css = trim($css);
                }

                return '<style' . $attrs . '>' . $css . '</style>';
            },
            $this->html
        );
    }

    private function processInlineJs() {
        $this->html = preg_replace_callback(
            '/<script([^>]*)>(.*?)<\/script>/is',
            function($matches) {
                $attrs = $matches[1];
                $js = $matches[2];

                if (preg_match('/\bsrc\s*=/', $attrs)) {
                    return $matches[0];
                }

                if (trim($js) === '') {
                    return $matches[0];
                }

                if ($this->options['remove_js_comments']) {
                    $js = $this->removeJsComments($js);
                }

                if ($this->options['minify_inline_js']) {
                    $js = $this->minifyJs($js);
                }

                return '<script' . $attrs . '>' . $js . '</script>';
            },
            $this->html
        );
    }

    private function removeJsComments($js) {
        $protected = [];
        $index = 0;

        $js = preg_replace_callback('/"(?:[^"\\\\]|\\\\.)*"/', function($m) use (&$protected, &$index) {
            $key = "___STR_DBL_{$index}___";
            $protected[$key] = $m[0];
            $index++;
            return $key;
        }, $js);

        $js = preg_replace_callback("/'(?:[^'\\\\]|\\\\.)*'/", function($m) use (&$protected, &$index) {
            $key = "___STR_SGL_{$index}___";
            $protected[$key] = $m[0];
            $index++;
            return $key;
        }, $js);

        $js = preg_replace_callback('/`(?:[^`\\\\]|\\\\.)*`/', function($m) use (&$protected, &$index) {
            $key = "___STR_TPL_{$index}___";
            $protected[$key] = $m[0];
            $index++;
            return $key;
        }, $js);

        $js = preg_replace_callback('/(?<=[\s=\(,\[!&|?:;{}])\/(?![\/\*])(?:[^\/\\\\\n\r]|\\\\.)+\/[gimyus]*/', function($m) use (&$protected, &$index) {
            $key = "___REGEX_{$index}___";
            $protected[$key] = $m[0];
            $index++;
            return $key;
        }, $js);

        $js = preg_replace('/\/\*[\s\S]*?\*\//', '', $js);
        $js = preg_replace('/(?<!:)\/\/[^\n\r]*/', '', $js);

        foreach ($protected as $key => $value) {
            $js = str_replace($key, $value, $js);
        }

        return $js;
    }

    private function minifyJs($js) {
        $protected = [];
        $index = 0;

        $js = preg_replace_callback('/"(?:[^"\\\\]|\\\\.)*"/', function($m) use (&$protected, &$index) {
            $key = "___STR_DBL_{$index}___";
            $protected[$key] = $m[0];
            $index++;
            return $key;
        }, $js);

        $js = preg_replace_callback("/'(?:[^'\\\\]|\\\\.)*'/", function($m) use (&$protected, &$index) {
            $key = "___STR_SGL_{$index}___";
            $protected[$key] = $m[0];
            $index++;
            return $key;
        }, $js);

        $js = preg_replace_callback('/`(?:[^`\\\\]|\\\\.)*`/', function($m) use (&$protected, &$index) {
            $key = "___STR_TPL_{$index}___";
            $protected[$key] = $m[0];
            $index++;
            return $key;
        }, $js);

        $js = str_replace(["\r\n", "\r", "\n"], ' ', $js);
        $js = preg_replace('/\s+/', ' ', $js);
        $js = preg_replace('/\s*([{}()\[\];,.<>:?=+\-*\/%!&|^~])\s*/', '$1', $js);

        $keywords = ['var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'typeof', 'instanceof', 'throw', 'try', 'catch', 'finally', 'class', 'extends', 'import', 'export', 'from', 'default', 'async', 'await', 'yield', 'delete', 'in', 'of', 'void'];

        foreach ($keywords as $keyword) {
            $js = preg_replace('/\b' . preg_quote($keyword, '/') . '\b(?=[a-zA-Z_$0-9])/', $keyword . ' ', $js);
        }

        foreach ($protected as $key => $value) {
            $js = str_replace($key, $value, $js);
        }

        return trim($js);
    }

    private function removeWhitespace() {
        $protected = [];
        $index = 0;

        $tags = ['pre', 'textarea', 'script', 'style', 'code'];
        foreach ($tags as $tag) {
            $this->html = preg_replace_callback(
                '/<' . $tag . '([^>]*)>.*?<\/' . $tag . '>/is',
                function($m) use (&$protected, &$index) {
                    $key = "___PROTECTED_{$index}___";
                    $protected[$key] = $m[0];
                    $index++;
                    return $key;
                },
                $this->html
            );
        }

        $this->html = preg_replace('/>\s+</', '><', $this->html);
        $this->html = preg_replace('/\s+/', ' ', $this->html);
        $this->html = str_replace(["\r\n", "\r", "\n"], '', $this->html);

        foreach ($protected as $key => $value) {
            $this->html = str_replace($key, $value, $this->html);
        }

        $this->html = trim($this->html);
    }
}

function minify_html($html, $options = []) {
    $minifier = new HtmlMinifier($options);
    return $minifier->minify($html);
}
