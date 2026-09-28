/**
 * ChiptuneSynth demo site: top bar, mobile drawer, CDN and Open Source modals.
 *
 * Loaded right after <body> on every page of the site:
 *     <script src="assets/nav.js"></script>        (from the home page)
 *     <script src="../assets/nav.js"></script>     (from examples/)
 * It writes the menu in place, so the page never shows without it. Links are
 * built from the script's own address, so the site works at the root of its
 * domain, in a sub-folder, or under a language prefix (/fr/...).
 * Styles: assets/nav.css.
 *
 * Translation: every visible string goes through t('...'). The site's PHP
 * layer (server only, not in this repository) reads those t() strings from
 * this file and puts their translations in window.CS_SITE, with the list of
 * languages. Without it the English is shown as it is. Keep each t() string
 * on one line, in single quotes, so it can be found.
 *
 * Copyright (C) 2026 8Binami SAS
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var SITE = window.CS_SITE || {};
    var T = SITE.i18n || {};
    var t = function (s) { return Object.prototype.hasOwnProperty.call(T, s) ? T[s] : s; };

    var ENGINE_VERSION = '3.2.0';
    var CDN = 'https://cdn.8binami.com/chiptune-synth/' + ENGINE_VERSION + '/';

    var MENU = [
        { key: 'learn', label: t('Learn'), icon: '📚', items: [
            { file: 'getting-started', label: t('Getting Started'), desc: t('Your first sound in 3 lines of code') },
            { file: 'basic', label: t('Basic'), desc: t('Notes, chords & waveforms') },
            { file: 'docs', label: t('Docs'), desc: t('Full API reference') }
        ] },
        { key: 'sounds', label: t('Sounds'), icon: '🎵', items: [
            { file: 'game-sfx', label: t('Game SFX'), desc: t('Built-in retro sound presets') },
            { file: 'melody', label: t('Melodies'), desc: t('Full musical compositions') },
            { file: 'instruments', label: t('Instruments'), desc: t('170+ instrument presets') },
            { file: 'showcase', label: t('Showcase'), desc: t('Live CodePen demos') }
        ] },
        { key: 'create', label: t('Create'), icon: '🎛️', items: [
            { file: 'sound-design', label: t('Sound Design'), desc: t('Real-time parameter sculpting') },
            { file: 'synthe-v2', label: t('Synth Lab v2'), desc: t('Full synthesizer playground') },
            { file: 'soundboard', label: t('Soundboard'), desc: t('Custom trigger pads') }
        ] },
        { key: 'play', label: t('Play'), icon: '🎮', items: [
            { file: 'mini-game', label: t('Catcher'), desc: t('Catch coins, dodge the bombs') },
            { file: 'platformer', label: t('Platformer'), desc: t('Side-scrolling chiptune game') }
        ] }
    ];

    // ── Where the site lives, and which page this is ─────────────────────────
    var script = document.currentScript;
    var base = script ? script.src.replace(/assets\/nav\.js(\?.*)?$/, '') : '/';
    var here = location.href.split('#')[0].split('?')[0];
    var rel = here.indexOf(base) === 0 ? here.slice(base.length) : '';
    var m = rel.match(/^examples\/([a-z0-9-]+)(\.html)?\/?$/);
    var page = m ? m[1] : (rel === '' || rel === 'index.html' ? 'index' : '');
    var section = '';
    MENU.forEach(function (s) { s.items.forEach(function (i) { if (i.file === page) section = s.key; }); });
    var home = base;
    var link = function (file) { return base + 'examples/' + file; };

    var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var CHEVRON = '<svg class="cs-chevron" viewBox="0 0 10 6" width="10" height="6"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
    var COPY_ICON = '<svg viewBox="0 0 16 16"><path d="M4 2h7a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM2 5H1v9a1 1 0 0 0 1 1h8v-1H2V5z"/></svg>';
    var CDN_ICON = '<svg viewBox="0 0 16 16"><path d="M13.5 8a5.5 5.5 0 1 0-10.2 2.83A3 3 0 1 0 5 16h7.5a3.5 3.5 0 0 0 .5-6.96L13.5 8zM9 7h2l-3 5-3-5h2V4h2v3z"/></svg>';
    var GITHUB_ICON = '<svg viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
    var NPM_ICON = '<svg viewBox="0 0 16 16"><path d="M0 0v16h16V0H0zm13 13H8V5h-2v8H3V3h10v10z"/></svg>';
    var GLOBE_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>';

    // Languages, when the PHP layer gives them: [{ code, name, url, active }]
    var LANGS = Array.isArray(SITE.langs) ? SITE.langs : [];
    var current = LANGS.filter(function (l) { return l.active; })[0];

    // ── Markup ───────────────────────────────────────────────────────────────
    var desktop = MENU.map(function (s) {
        var on = s.key === section;
        return '<div class="cs-nav-section' + (on ? ' has-active' : '') + '" data-section="' + s.key + '">'
            + '<button class="cs-nav-trigger' + (on ? ' active' : '') + '" aria-expanded="false" aria-controls="cs-drop-' + s.key + '">'
            + '<span>' + s.icon + ' ' + esc(s.label) + '</span>' + CHEVRON + '</button>'
            + '<div class="cs-dropdown" id="cs-drop-' + s.key + '" role="menu">'
            + '<div class="cs-dropdown-head"><span class="cs-dropdown-icon">' + s.icon + '</span><span class="cs-dropdown-title">' + esc(s.label) + '</span></div>'
            + s.items.map(function (i) {
                return '<a href="' + link(i.file) + '" class="cs-dropdown-item' + (i.file === page ? ' active' : '') + '" role="menuitem">'
                    + '<span class="cs-dropdown-item-name">' + esc(i.label) + '</span><span class="cs-dropdown-item-desc">' + esc(i.desc) + '</span></a>';
            }).join('')
            + '</div></div>';
    }).join('');

    var mobile = MENU.map(function (s) {
        return '<div class="cs-mobile-section' + (s.key === section ? ' open' : '') + '">'
            + '<button class="cs-mobile-section-trigger"><span>' + s.icon + ' ' + esc(s.label) + '</span>' + CHEVRON + '</button>'
            + '<div class="cs-mobile-section-items">'
            + s.items.map(function (i) {
                return '<a href="' + link(i.file) + '" class="cs-mobile-item' + (i.file === page ? ' active' : '') + '">'
                    + '<span class="cs-mobile-item-name">' + esc(i.label) + '</span><span class="cs-mobile-item-desc">' + esc(i.desc) + '</span></a>';
            }).join('')
            + '</div></div>';
    }).join('');

    var langDesktop = LANGS.length ? '<div class="cs-lang-switcher">'
        + '<button class="cs-lang-btn" aria-label="' + esc(t('Language')) + '">' + GLOBE_ICON + '<span>' + esc((current ? current.code : 'en').toUpperCase()) + '</span>' + CHEVRON + '</button>'
        + '<div class="cs-lang-dropdown">' + LANGS.map(function (l) {
            return '<a href="' + esc(l.url) + '" hreflang="' + esc(l.code) + '"' + (l.active ? ' class="active"' : '') + '>' + esc(l.name) + '</a>';
        }).join('') + '</div></div>' : '';

    var langMobile = LANGS.length ? '<div class="cs-mobile-langs" translate="no">' + LANGS.map(function (l) {
        return '<a href="' + esc(l.url) + '" hreflang="' + esc(l.code) + '" class="cs-mobile-lang' + (l.active ? ' active' : '') + '">' + esc(l.code.toUpperCase()) + '</a>';
    }).join('') + '</div>' : '';

    var cdnLine = function (id, file) {
        return '<div class="cs-modal-row"><code id="' + id + '" translate="no">&lt;script src="' + CDN + file + '"&gt;&lt;/script&gt;</code>'
            + '<button class="cs-copy-btn" data-copy-line="' + id + '" title="' + esc(t('Copy')) + '">' + COPY_ICON + '</button></div>';
    };

    var html = ''
        + '<nav class="cs-topbar" id="csTopbar"><div class="cs-topbar-inner">'
        + '<a href="' + home + '" class="cs-logo" translate="no"><span class="cs-logo-icon">&#9835;</span> Chiptune<span class="cs-logo-accent">Synth</span></a>'
        + '<div class="cs-nav-main" id="csNavMain">'
        + '<a href="' + home + '" class="cs-nav-direct' + (page === 'index' ? ' active' : '') + '">' + esc(t('Main Demo')) + '</a>'
        + desktop
        + '</div>'
        + '<div class="cs-nav-btns" translate="no">'
        + '<button type="button" class="cs-btn cs-btn-oss" data-oss-open title="' + esc(t('ChiptuneSynth is now open source')) + '"><span class="cs-oss-dot" aria-hidden="true"></span><span>' + esc(t('Open Source')) + '</span></button>'
        + '<button type="button" class="cs-btn cs-btn-cdn" data-cdn-open>' + CDN_ICON + '<span>CDN</span></button>'
        + '<a href="https://github.com/8binami/chiptune-synth" class="cs-btn cs-btn-github" target="_blank" rel="noopener">' + GITHUB_ICON + '<span>GitHub</span></a>'
        + '<a href="https://www.npmjs.com/package/@8bitforge/chiptune-synth" class="cs-btn cs-btn-npm" target="_blank" rel="noopener">' + NPM_ICON + '<span>npm</span></a>'
        + langDesktop
        + '</div>'
        + '<button class="cs-hamburger" id="csHamburger" aria-label="' + esc(t('Menu')) + '" aria-expanded="false"><span></span><span></span><span></span></button>'
        + '</div></nav>'

        + '<div class="cs-mobile-nav" id="csMobileNav"><div class="cs-mobile-nav-inner">'
        + '<a href="' + home + '" class="cs-mobile-direct' + (page === 'index' ? ' active' : '') + '">' + esc(t('Main Demo')) + '</a>'
        + '<button type="button" class="cs-mobile-direct cs-mobile-oss" data-oss-open><span class="cs-oss-dot" aria-hidden="true"></span> ' + esc(t('ChiptuneSynth is now open source')) + '</button>'
        + mobile
        + langMobile
        + '</div></div>'
        + '<div class="cs-mobile-overlay" id="csMobileOverlay"></div>'
        + '<div class="cs-topbar-spacer"></div>'

        + '<div id="cdnModal" class="cs-modal-overlay"><div class="cs-modal">'
        + '<div class="cs-modal-header"><span>' + CDN_ICON.replace('<svg ', '<svg width="16" height="16" style="fill:#00f0ff;margin-right:6px;vertical-align:-2px" ')
        + 'CDN <span style="color:#555;font-weight:400;font-size:.8rem;margin-left:6px" translate="no">v' + ENGINE_VERSION + '</span></span>'
        + '<button class="cs-modal-close" data-cdn-close aria-label="' + esc(t('Close')) + '">&times;</button></div>'
        + '<p class="cs-modal-desc">' + esc(t('Add these two tags to your page, before the closing body tag or in the head:')) + '</p>'
        + '<div class="cs-modal-block"><div class="cs-modal-label">' + esc(t('Synth Engine')) + '</div>' + cdnLine('cdnLine1', 'chiptune-synth.min.js') + '</div>'
        + '<div class="cs-modal-block"><div class="cs-modal-label">' + esc(t('Sound Font')) + ' <span style="color:#666">(' + esc(t('170+ instruments')) + ')</span></div>' + cdnLine('cdnLine2', 'chiptune-sound-font.min.js') + '</div>'
        + '<button class="cs-copy-all-btn" data-copy-all>' + COPY_ICON.replace('<svg ', '<svg width="14" height="14" ') + ' ' + esc(t('Copy all')) + '</button>'
        + '</div></div>'

        + '<div class="oss-modal" id="ossModal" hidden role="dialog" aria-modal="true" aria-labelledby="ossModalTitle" aria-describedby="ossModalDesc">'
        + '<div class="oss-modal-backdrop" data-oss-close></div><div class="oss-modal-card">'
        + '<button type="button" class="oss-modal-close" data-oss-close aria-label="' + esc(t('Close')) + '">&times;</button>'
        + '<div class="oss-modal-head"><span class="oss-modal-badge">' + esc(t('Now available')) + '</span><span class="oss-modal-overline">' + esc(t('A new chapter')) + '</span>'
        + '<h2 id="ossModalTitle">' + esc(t('8BitForge & ChiptuneSynth')) + '<br>' + esc(t('are now')) + ' <span class="oss-modal-highlight">' + esc(t('Open Source')) + '</span></h2>'
        + '<p id="ossModalDesc" class="oss-modal-lead">' + esc(t('Both are free software under the GNU AGPL-3.0. The 8BitForge studio runs entirely on your machine, with no account, no server and no cloud, and the ChiptuneSynth engine is yours to read, fork and improve.')) + '</p></div>'
        + '<div class="oss-modal-grid">'
        + '<div class="oss-tile"><span class="oss-tile-icon oss-tile-icon-green" aria-hidden="true" translate="no">&lt;/&gt;</span><h3>' + esc(t('Open Source')) + '</h3><p>' + esc(t('The full source code, app and engine, released under the GNU AGPL-3.0. Read it, fork it, improve it.')) + '</p></div>'
        + '<div class="oss-tile"><span class="oss-tile-icon oss-tile-icon-cyan" aria-hidden="true" translate="no">&#9632;&#9632;</span><h3>' + esc(t('100% Local')) + '</h3><p>' + esc(t('Your projects, presets and exports stay on your computer. Works offline, forever.')) + '</p></div>'
        + '<div class="oss-tile"><span class="oss-tile-icon oss-tile-icon-violet" aria-hidden="true" translate="no">&#9654;</span><h3>' + esc(t('New Engine')) + '</h3><p>' + esc(t('Rebuilt on Node.js and Electron for Windows, macOS and Linux.')) + '</p></div>'
        + '</div>'
        + '<code class="oss-modal-term" translate="no" aria-hidden="true"><span class="oss-term-prompt">&gt;</span> engine.start({ local: true, open: true }) <span class="oss-term-note">// &#9835; AGPL-3.0</span><span class="oss-cursor"></span></code>'
        + '<p class="oss-modal-note">' + esc(t('The npm package and the CDN stay available.')) + '</p>'
        + '<div class="oss-modal-actions">'
        + '<a href="https://github.com/8binami/chiptune-synth" target="_blank" rel="noopener" class="oss-btn oss-btn-primary">' + esc(t('View on GitHub')) + '</a>'
        + '<button type="button" class="oss-btn oss-btn-secondary" data-oss-close>' + esc(t('Continue to the demo')) + '</button>'
        + '</div></div></div>';

    if (script) script.insertAdjacentHTML('afterend', html);
    else document.body.insertAdjacentHTML('afterbegin', html);

    // ── Behaviour ────────────────────────────────────────────────────────────
    var $ = function (id) { return document.getElementById(id); };

    // Copy, with a fallback where the clipboard API is missing or refuses.
    function copy(text, done) {
        var fallback = function () {
            var f = document.createElement('textarea');
            f.value = text; f.setAttribute('readonly', ''); f.style.position = 'fixed'; f.style.opacity = '0';
            document.body.appendChild(f); f.select();
            try { if (document.execCommand('copy')) done(); } catch (e) { /* refused */ }
            f.remove();
        };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
        else fallback();
    }

    // CDN modal
    var cdn = $('cdnModal');
    document.querySelectorAll('[data-cdn-open]').forEach(function (b) { b.addEventListener('click', function () { cdn.classList.add('open'); }); });
    cdn.addEventListener('click', function (e) { if (e.target === cdn || e.target.closest('[data-cdn-close]')) cdn.classList.remove('open'); });
    cdn.querySelectorAll('[data-copy-line]').forEach(function (b) {
        b.addEventListener('click', function () {
            var saved = b.innerHTML;
            copy($(b.getAttribute('data-copy-line')).textContent, function () {
                b.innerHTML = '<svg viewBox="0 0 16 16"><path d="M13.5 2l-7.5 9-3.5-3.5-1 1 4.5 4.5 8.5-10z"/></svg>';
                setTimeout(function () { b.innerHTML = saved; }, 1500);
            });
        });
    });
    var all = cdn.querySelector('[data-copy-all]');
    all.addEventListener('click', function () {
        var saved = all.innerHTML;
        copy($('cdnLine1').textContent + '\n' + $('cdnLine2').textContent, function () {
            all.textContent = '✓ ' + t('Copied!'); all.style.background = 'rgba(0,240,255,.2)';
            setTimeout(function () { all.innerHTML = saved; all.style.background = ''; }, 1800);
        });
    });

    // Open Source announcement: once per visitor, ?oss=1 forces it.
    (function () {
        var modal = $('ossModal');
        var KEY = 'cs_oss_announce_v2';
        var forced = new URLSearchParams(location.search).get('oss') === '1';
        var dismissed = false;
        try { dismissed = localStorage.getItem(KEY) === '1'; } catch (e) { /* storage blocked */ }
        var lastFocus = null;
        var remember = function () { try { localStorage.setItem(KEY, '1'); } catch (e) { /* storage blocked */ } };
        function onKey(e) { if (e.key === 'Escape') close(); }
        function open() {
            lastFocus = document.activeElement;
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
            void modal.offsetWidth; // reflow so the transition runs
            modal.classList.add('oss-visible');
            var c = modal.querySelector('.oss-modal-close'); if (c) c.focus();
            document.addEventListener('keydown', onKey);
        }
        function close() {
            remember();
            modal.classList.remove('oss-visible');
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKey);
            setTimeout(function () { modal.hidden = true; }, 300);
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }
        modal.querySelectorAll('[data-oss-close]').forEach(function (el) { el.addEventListener('click', close); });
        modal.querySelectorAll('a[href]').forEach(function (a) { a.addEventListener('click', remember); });
        document.querySelectorAll('[data-oss-open]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                var drawer = $('csMobileNav');
                if (drawer && drawer.classList.contains('open')) $('csHamburger').click();
                open();
            });
        });
        if (dismissed && !forced) return;
        setTimeout(open, forced ? 200 : 1200);
    })();

    // Desktop mega menu: open on hover or click, close on leave, outside click or Escape.
    (function () {
        var sections = document.querySelectorAll('.cs-nav-section');
        var timer;
        var closeAll = function () {
            sections.forEach(function (s) {
                s.classList.remove('open');
                var tr = s.querySelector('.cs-nav-trigger'); if (tr) tr.setAttribute('aria-expanded', 'false');
            });
        };
        sections.forEach(function (sec) {
            var trigger = sec.querySelector('.cs-nav-trigger');
            var drop = sec.querySelector('.cs-dropdown');
            function open() { clearTimeout(timer); closeAll(); sec.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); }
            function later() { timer = setTimeout(function () { sec.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); }, 120); }
            trigger.addEventListener('mouseenter', open);
            trigger.addEventListener('focus', open);
            drop.addEventListener('mouseenter', function () { clearTimeout(timer); });
            drop.addEventListener('mouseleave', later);
            sec.addEventListener('mouseleave', later);
            trigger.addEventListener('click', function () { if (sec.classList.contains('open')) closeAll(); else open(); });
        });
        document.addEventListener('click', function (e) { if (!e.target.closest('.cs-nav-section')) closeAll(); });
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            closeAll();
            cdn.classList.remove('open');
        });
    })();

    // Language switcher (only with the PHP layer)
    (function () {
        var btn = document.querySelector('.cs-lang-btn');
        var wrap = document.querySelector('.cs-lang-switcher');
        if (!btn || !wrap) return;
        btn.addEventListener('click', function (e) { e.stopPropagation(); wrap.classList.toggle('open'); });
        document.addEventListener('click', function () { wrap.classList.remove('open'); });
    })();

    // Mobile drawer and its accordions.
    (function () {
        var btn = $('csHamburger'), drawer = $('csMobileNav'), overlay = $('csMobileOverlay');
        function toggle(force) {
            var open = force !== undefined ? force : !drawer.classList.contains('open');
            drawer.classList.toggle('open', open);
            overlay.classList.toggle('open', open);
            btn.classList.toggle('open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            document.body.style.overflow = open ? 'hidden' : '';
        }
        btn.addEventListener('click', function () { toggle(); });
        overlay.addEventListener('click', function () { toggle(false); });
        document.querySelectorAll('.cs-mobile-section-trigger').forEach(function (tr) {
            tr.addEventListener('click', function () { tr.closest('.cs-mobile-section').classList.toggle('open'); });
        });
    })();
})();
