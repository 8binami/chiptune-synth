<?php
/**
 * ChiptuneSynth — Mega Menu Navigation
 * 4 thematic sections: Learn / Sounds / Create / Play
 * Desktop: per-section dropdowns on hover
 * Mobile: hamburger + accordions
 */

$megaMenu = [
    'learn' => [
        'label' => 'Learn',
        'icon'  => '📚',
        'items' => [
            ['file' => 'getting-started', 'label' => 'Getting Started', 'desc' => 'Your first sound in 3 lines of code'],
            ['file' => 'basic',           'label' => 'Basic',           'desc' => 'Notes, chords & waveforms'],
            ['file' => 'docs',            'label' => 'Docs',            'desc' => 'Full API reference'],
        ],
    ],
    'sounds' => [
        'label' => 'Sounds',
        'icon'  => '🎵',
        'items' => [
            ['file' => 'game-sfx',    'label' => 'Game SFX',    'desc' => 'Built-in retro sound presets'],
            ['file' => 'melody',      'label' => 'Melodies',    'desc' => 'Full musical compositions'],
            ['file' => 'instruments', 'label' => 'Instruments', 'desc' => '170+ instrument presets'],
            ['file' => 'showcase',    'label' => 'Showcase',    'desc' => 'Live CodePen demos'],
        ],
    ],
    'create' => [
        'label' => 'Create',
        'icon'  => '🎛️',
        'items' => [
            ['file' => 'sound-design', 'label' => 'Sound Design', 'desc' => 'Real-time parameter sculpting'],
            ['file' => 'synthe-v2',    'label' => 'Synth Lab v2', 'desc' => 'Full synthesizer playground'],
            ['file' => 'soundboard',   'label' => 'Soundboard',   'desc' => 'Custom trigger pads'],
        ],
    ],
    'play' => [
        'label' => 'Play',
        'icon'  => '🎮',
        'items' => [
            ['file' => 'mini-game',  'label' => 'Catcher',    'desc' => 'Catch coins, dodge the bombs'],
            ['file' => 'platformer', 'label' => 'Platformer', 'desc' => 'Side-scrolling chiptune game'],
        ],
    ],
];

// Determine which mega section contains the current page
$currentSection = '';
foreach ($megaMenu as $sectionKey => $section) {
    foreach ($section['items'] as $item) {
        if ($currentPage === $item['file']) {
            $currentSection = $sectionKey;
            break 2;
        }
    }
}

$isIndex    = ($currentPage === 'index' || $currentPage === '');
$langPrefix = (defined('CURRENT_LANG') && CURRENT_LANG !== 'en') ? '/' . CURRENT_LANG : '';
$basePath   = BASE_URL . $langPrefix;
?>

<nav class="cs-topbar" id="csTopbar">
    <div class="cs-topbar-inner">

        <!-- Logo -->
        <a href="<?= BASE_URL ?><?= $langPrefix ?>/" class="cs-logo" translate="no">
            <span class="cs-logo-icon">&#9835;</span> Chiptune<span class="cs-logo-accent">Synth</span>
        </a>

        <!-- Desktop nav -->
        <div class="cs-nav-main" id="csNavMain">

            <!-- Direct link: Main Demo -->
            <a href="<?= BASE_URL ?><?= $langPrefix ?>/"
               class="cs-nav-direct<?= $isIndex ? ' active' : '' ?>">Main Demo</a>

            <!-- Mega menu triggers -->
            <?php foreach ($megaMenu as $sectionKey => $section):
                $isActiveSection = ($currentSection === $sectionKey);
            ?>
            <div class="cs-nav-section<?= $isActiveSection ? ' has-active' : '' ?>"
                 data-section="<?= $sectionKey ?>">

                <button class="cs-nav-trigger<?= $isActiveSection ? ' active' : '' ?>"
                        aria-expanded="false"
                        aria-controls="cs-drop-<?= $sectionKey ?>">
                    <span><?= htmlspecialchars($section['icon']) ?> <?= htmlspecialchars($section['label']) ?></span>
                    <svg class="cs-chevron" viewBox="0 0 10 6" width="10" height="6">
                        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                    </svg>
                </button>

                <!-- Dropdown panel -->
                <div class="cs-dropdown" id="cs-drop-<?= $sectionKey ?>" role="menu">
                    <div class="cs-dropdown-head">
                        <span class="cs-dropdown-icon"><?= $section['icon'] ?></span>
                        <span class="cs-dropdown-title"><?= htmlspecialchars($section['label']) ?></span>
                    </div>
                    <?php foreach ($section['items'] as $item):
                        $isActivePage = ($currentPage === $item['file']);
                    ?>
                    <a href="<?= BASE_URL ?><?= $langPrefix ?>/examples/<?= $item['file'] ?>"
                       class="cs-dropdown-item<?= $isActivePage ? ' active' : '' ?>"
                       role="menuitem">
                        <span class="cs-dropdown-item-name"><?= htmlspecialchars($item['label']) ?></span>
                        <span class="cs-dropdown-item-desc"><?= htmlspecialchars($item['desc']) ?></span>
                    </a>
                    <?php endforeach; ?>
                </div>

            </div>
            <?php endforeach; ?>

        </div><!-- /cs-nav-main -->

        <!-- Right buttons + language switcher -->
        <div class="cs-nav-btns" translate="no">

            <button onclick="document.getElementById('cdnModal').classList.add('open')"
                    class="cs-btn cs-btn-cdn">
                <svg viewBox="0 0 16 16"><path d="M13.5 8a5.5 5.5 0 1 0-10.2 2.83A3 3 0 1 0 5 16h7.5a3.5 3.5 0 0 0 .5-6.96L13.5 8zM9 7h2l-3 5-3-5h2V4h2v3z"/></svg>
                <span>CDN</span>
            </button>

            <a href="https://github.com/8Binami/chiptune-synth"
               class="cs-btn cs-btn-github" target="_blank" rel="noopener">
                <svg viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                <span>GitHub</span>
            </a>

            <a href="https://www.npmjs.com/package/@8bitforge/chiptune-synth"
               class="cs-btn cs-btn-npm" target="_blank" rel="noopener">
                <svg viewBox="0 0 16 16"><path d="M0 0v16h16V0H0zm13 13H8V5h-2v8H3V3h10v10z"/></svg>
                <span>npm</span>
            </a>

            <?php if (defined('CURRENT_LANG') && !empty($i18nConfig)): ?>
            <div class="cs-lang-switcher">
                <button class="cs-lang-btn" aria-label="Language">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/>
                    </svg>
                    <span><?= strtoupper(CURRENT_LANG) ?></span>
                    <svg class="cs-chevron" viewBox="0 0 10 6" width="9" height="9">
                        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                    </svg>
                </button>
                <div class="cs-lang-dropdown">
                    <?php
                    $currentSlug = $isIndex ? '' : 'examples/' . $currentPage;
                    foreach ($i18nConfig['supported_langs'] as $lc):
                        $langUrl = rtrim(BASE_URL, '/') . '/' . $lc . '/' . $currentSlug;
                    ?>
                    <a href="<?= $langUrl ?>"<?= ($lc === CURRENT_LANG) ? ' class="active"' : '' ?>>
                        <?= $i18nConfig['lang_names'][$lc] ?>
                    </a>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>

        </div><!-- /cs-nav-btns -->

        <!-- Hamburger (mobile) -->
        <button class="cs-hamburger" id="csHamburger" aria-label="Menu" aria-expanded="false">
            <span></span><span></span><span></span>
        </button>

    </div><!-- /cs-topbar-inner -->
</nav>

<!-- Mobile nav drawer -->
<div class="cs-mobile-nav" id="csMobileNav">
    <div class="cs-mobile-nav-inner">

        <a href="<?= BASE_URL ?><?= $langPrefix ?>/"
           class="cs-mobile-direct<?= $isIndex ? ' active' : '' ?>">Main Demo</a>

        <?php foreach ($megaMenu as $sectionKey => $section):
            $isActiveSection = ($currentSection === $sectionKey);
        ?>
        <div class="cs-mobile-section<?= $isActiveSection ? ' open' : '' ?>">
            <button class="cs-mobile-section-trigger">
                <span><?= $section['icon'] ?> <?= htmlspecialchars($section['label']) ?></span>
                <svg class="cs-chevron" viewBox="0 0 10 6" width="10" height="6">
                    <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                </svg>
            </button>
            <div class="cs-mobile-section-items">
                <?php foreach ($section['items'] as $item):
                    $isActivePage = ($currentPage === $item['file']);
                ?>
                <a href="<?= BASE_URL ?><?= $langPrefix ?>/examples/<?= $item['file'] ?>"
                   class="cs-mobile-item<?= $isActivePage ? ' active' : '' ?>">
                    <span class="cs-mobile-item-name"><?= htmlspecialchars($item['label']) ?></span>
                    <span class="cs-mobile-item-desc"><?= htmlspecialchars($item['desc']) ?></span>
                </a>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endforeach; ?>

        <!-- Mobile language switcher -->
        <?php if (defined('CURRENT_LANG') && !empty($i18nConfig)): ?>
        <div class="cs-mobile-langs" translate="no">
            <?php foreach ($i18nConfig['supported_langs'] as $lc):
                $langUrl = rtrim(BASE_URL, '/') . '/' . $lc . '/' . $currentSlug;
            ?>
            <a href="<?= $langUrl ?>" class="cs-mobile-lang<?= ($lc === CURRENT_LANG) ? ' active' : '' ?>">
                <?= strtoupper($lc) ?>
            </a>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

    </div>
</div>
<div class="cs-mobile-overlay" id="csMobileOverlay"></div>

<div class="cs-topbar-spacer"></div>

<!-- ── CDN Modal ─────────────────────────────────────────────────────────── -->
<div id="cdnModal" class="cs-modal-overlay" onclick="if(event.target===this)this.classList.remove('open')">
    <div class="cs-modal">
        <div class="cs-modal-header">
            <span>
                <svg viewBox="0 0 16 16" width="16" height="16" style="fill:#00f0ff;margin-right:6px;vertical-align:-2px"><path d="M13.5 8a5.5 5.5 0 1 0-10.2 2.83A3 3 0 1 0 5 16h7.5a3.5 3.5 0 0 0 .5-6.96L13.5 8zM9 7h2l-3 5-3-5h2V4h2v3z"/></svg>
                CDN <span style="color:#555;font-weight:400;font-size:.8rem;margin-left:6px" translate="no">v3.0.0</span>
            </span>
            <button class="cs-modal-close" onclick="document.getElementById('cdnModal').classList.remove('open')">&times;</button>
        </div>
        <p class="cs-modal-desc">Add these two tags to your page — before <code>&lt;/body&gt;</code> or in <code>&lt;head&gt;</code> :</p>
        <div class="cs-modal-block">
            <div class="cs-modal-label">Synth Engine</div>
            <div class="cs-modal-row">
                <code id="cdnLine1" translate="no">&lt;script src="https://cdn.chiptune-synth.8binami.com/3.0.0/chiptune-synth.min.js"&gt;&lt;/script&gt;</code>
                <button class="cs-copy-btn" onclick="csCopy('cdnLine1',this)" title="Copy">
                    <svg viewBox="0 0 16 16"><path d="M4 2h7a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM2 5H1v9a1 1 0 0 0 1 1h8v-1H2V5z"/></svg>
                </button>
            </div>
        </div>
        <div class="cs-modal-block">
            <div class="cs-modal-label">Sound Font <span style="color:#666" translate="no">(170+ instruments)</span></div>
            <div class="cs-modal-row">
                <code id="cdnLine2" translate="no">&lt;script src="https://cdn.chiptune-synth.8binami.com/3.0.0/chiptune-sound-font.min.js"&gt;&lt;/script&gt;</code>
                <button class="cs-copy-btn" onclick="csCopy('cdnLine2',this)" title="Copy">
                    <svg viewBox="0 0 16 16"><path d="M4 2h7a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM2 5H1v9a1 1 0 0 0 1 1h8v-1H2V5z"/></svg>
                </button>
            </div>
        </div>
        <button class="cs-copy-all-btn" onclick="csCopyAll(this)">
            <svg viewBox="0 0 16 16" width="14" height="14"><path d="M4 2h7a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM2 5H1v9a1 1 0 0 0 1 1h8v-1H2V5z"/></svg>
            Copy all
        </button>
    </div>
</div>

<script>
/* ── CDN modal copy ─────────────────────────────────────────── */
function csCopy(id, btn) {
    navigator.clipboard.writeText(document.getElementById(id).textContent).then(function () {
        var s = btn.innerHTML;
        btn.innerHTML = '<svg viewBox="0 0 16 16"><path d="M13.5 2l-7.5 9-3.5-3.5-1 1 4.5 4.5 8.5-10z"/></svg>';
        setTimeout(function () { btn.innerHTML = s; }, 1500);
    });
}
function csCopyAll(btn) {
    var t = document.getElementById('cdnLine1').textContent + '\n' + document.getElementById('cdnLine2').textContent;
    navigator.clipboard.writeText(t).then(function () {
        var s = btn.innerHTML;
        btn.innerHTML = '✓ Copied!';
        btn.style.background = 'rgba(0,240,255,.2)';
        setTimeout(function () { btn.innerHTML = s; btn.style.background = ''; }, 1800);
    });
}
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.getElementById('cdnModal').classList.remove('open');
});

/* ── Mega menu (desktop) ─────────────────────────────────────── */
(function () {
    var sections = document.querySelectorAll('.cs-nav-section');
    var closeTimer;

    sections.forEach(function (sec) {
        var trigger = sec.querySelector('.cs-nav-trigger');
        var drop    = sec.querySelector('.cs-dropdown');
        if (!trigger || !drop) return;

        function open() {
            clearTimeout(closeTimer);
            // Close all others first
            sections.forEach(function (s) {
                s.classList.remove('open');
                var t = s.querySelector('.cs-nav-trigger');
                if (t) t.setAttribute('aria-expanded', 'false');
            });
            sec.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
        }
        function scheduleClose() {
            closeTimer = setTimeout(function () {
                sec.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
            }, 120);
        }

        trigger.addEventListener('mouseenter', open);
        trigger.addEventListener('focus',      open);
        drop.addEventListener('mouseenter',    function () { clearTimeout(closeTimer); });
        drop.addEventListener('mouseleave',    scheduleClose);
        sec.addEventListener('mouseleave',     scheduleClose);

        trigger.addEventListener('click', function () {
            if (sec.classList.contains('open')) {
                sec.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
            } else {
                open();
            }
        });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.cs-nav-section')) {
            sections.forEach(function (s) {
                s.classList.remove('open');
                var t = s.querySelector('.cs-nav-trigger');
                if (t) t.setAttribute('aria-expanded', 'false');
            });
        }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            sections.forEach(function (s) {
                s.classList.remove('open');
                var t = s.querySelector('.cs-nav-trigger');
                if (t) t.setAttribute('aria-expanded', 'false');
            });
        }
    });
})();

/* ── Language switcher ───────────────────────────────────────── */
(function () {
    var langBtn  = document.querySelector('.cs-lang-btn');
    var langWrap = document.querySelector('.cs-lang-switcher');
    if (!langBtn || !langWrap) return;

    langBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        langWrap.classList.toggle('open');
    });
    document.addEventListener('click', function () {
        langWrap.classList.remove('open');
    });
})();

/* ── Mobile hamburger ────────────────────────────────────────── */
(function () {
    var btn     = document.getElementById('csHamburger');
    var drawer  = document.getElementById('csMobileNav');
    var overlay = document.getElementById('csMobileOverlay');
    if (!btn || !drawer) return;

    function toggle(force) {
        var open = (force !== undefined) ? force : !drawer.classList.contains('open');
        drawer.classList.toggle('open', open);
        overlay.classList.toggle('open', open);
        btn.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
    }

    btn.addEventListener('click', function () { toggle(); });
    overlay.addEventListener('click', function () { toggle(false); });

    // Mobile accordion sections
    document.querySelectorAll('.cs-mobile-section-trigger').forEach(function (t) {
        t.addEventListener('click', function () {
            var section = t.closest('.cs-mobile-section');
            section.classList.toggle('open');
        });
    });
})();
</script>
