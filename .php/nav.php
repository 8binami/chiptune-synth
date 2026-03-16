<?php
/**
 * ChiptuneSynth — Shared Navigation Component
 *
 * Injected automatically by index.php (front controller).
 * Requires: ROOT_DIR, BASE_URL constants + $currentPage variable.
 */

$navLinks = [
    ['file' => 'getting-started', 'label' => 'Getting Started'],
    ['file' => 'basic',           'label' => 'Basic'],
    ['file' => 'game-sfx',        'label' => 'Game SFX'],
    ['file' => 'melody',          'label' => 'Melodies'],
    ['file' => 'instruments',     'label' => 'Instruments'],
    ['file' => 'sound-design',    'label' => 'Sound Design'],
    ['file' => 'mini-game',       'label' => 'Catcher'],
    ['file' => 'platformer',      'label' => 'Platformer'],
    ['file' => 'soundboard',      'label' => 'Soundboard'],
    ['file' => 'docs',            'label' => 'Docs'],
];

$isIndex = ($currentPage === 'index' || $currentPage === '');
?>
<nav class="cs-topbar">
    <div class="cs-topbar-inner">
        <a href="<?= BASE_URL ?>/" class="cs-logo">
            <span class="cs-logo-icon">&#9835;</span> Chiptune<span class="cs-logo-accent">Synth</span>
        </a>
        <div class="cs-nav-links">
            <a href="<?= BASE_URL ?>/"<?= $isIndex ? ' class="active"' : '' ?>>Main Demo</a>
            <?php foreach ($navLinks as $link): ?>
                <a href="<?= BASE_URL ?>/examples/<?= $link['file'] ?>"<?= ($currentPage === $link['file']) ? ' class="active"' : '' ?>><?= $link['label'] ?></a>
            <?php endforeach; ?>
        </div>
        <div class="cs-nav-btns">
            <a href="https://github.com/8Binami/chiptune-synth" class="cs-btn cs-btn-github" target="_blank" rel="noopener">
                <svg viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                <span>GitHub</span>
            </a>
            <a href="https://www.npmjs.com/package/@8bitforge/chiptune-synth" class="cs-btn cs-btn-npm" target="_blank" rel="noopener">
                <svg viewBox="0 0 16 16"><path d="M0 0v16h16V0H0zm13 13H8V5h-2v8H3V3h10v10z"/></svg>
                <span>npm</span>
            </a>
        </div>
    </div>
</nav>
<div class="cs-topbar-spacer"></div>
