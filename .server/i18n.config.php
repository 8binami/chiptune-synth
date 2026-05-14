<?php
/**
 * ChiptuneSynth — i18n Configuration (server-only)
 */
return [
    'default_lang'    => 'en',
    'supported_langs' => ['en', 'es', 'zh', 'pt', 'ja', 'de', 'fr', 'ko', 'it', 'ru'],

    'lang_names' => [
        'en' => 'English',
        'es' => 'Español',
        'zh' => '简体中文',
        'pt' => 'Português',
        'ja' => '日本語',
        'de' => 'Deutsch',
        'fr' => 'Français',
        'ko' => '한국어',
        'it' => 'Italiano',
        'ru' => 'Русский',
    ],

    'lang_hreflang' => [
        'en' => 'en-US',
        'es' => 'es',
        'zh' => 'zh-Hans',
        'pt' => 'pt-BR',
        'ja' => 'ja',
        'de' => 'de',
        'fr' => 'fr',
        'ko' => 'ko',
        'it' => 'it',
        'ru' => 'ru',
    ],

    'lang_og_locale' => [
        'en' => 'en_US',
        'es' => 'es_ES',
        'zh' => 'zh_CN',
        'pt' => 'pt_BR',
        'ja' => 'ja_JP',
        'de' => 'de_DE',
        'fr' => 'fr_FR',
        'ko' => 'ko_KR',
        'it' => 'it_IT',
        'ru' => 'ru_RU',
    ],

    'cache_dir' => __DIR__ . '/cache/pages',

    'site_url' => 'https://chiptune-synth.8binami.com',

    'sitemap_priority' => [
        'home'            => '1.0',
        'docs'            => '0.9',
        'getting-started' => '0.9',
        'examples'        => '0.8',
        'instruments'     => '0.7',
        'game-sfx'        => '0.7',
        'melody'          => '0.6',
        'basic'           => '0.6',
        'showcase'        => '0.8',
    ],
];
