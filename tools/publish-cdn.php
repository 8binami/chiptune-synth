<?php
/**
 * Publishes the builds of dist/ on the CDN.  Usage, on the server:
 *
 *     php tools/publish-cdn.php <CDN folder> [--force]
 *
 * <CDN folder> is where the CDN serves the builds from (the folder holding
 * 3.2.0/, v3/…); the CHIPTUNE_CDN_DIR environment variable can give it
 * instead. No server path is written in this file. For every
 * dist/<version>/ (with its checksums-<version>.json) it:
 *   - checks the files against their fingerprints (a damaged build is refused);
 *   - copies a version the CDN does not have yet, then checks the copies;
 *   - leaves a version already published alone. If the CDN holds different
 *     files under the same number, it stops: a published version never
 *     changes (browsers and Cloudflare keep it a year). --force overrides.
 * Then v<major>/ (e.g. v3/) is pointed at the latest <major>.x.y of dist/.
 *
 * Copyright (C) 2026 8Binami SAS
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$args  = array_slice($argv, 1);
$force = in_array('--force', $args, true);
$paths = array_values(array_filter($args, fn ($a) => $a !== '--force'));
$cdn   = rtrim($paths[0] ?? (string) getenv('CHIPTUNE_CDN_DIR'), '/\\');
if ($cdn === '') {
    fwrite(STDERR, "Usage: php tools/publish-cdn.php <CDN folder> [--force]   (or set CHIPTUNE_CDN_DIR)\n");
    exit(1);
}
$dist  = dirname(__DIR__) . '/dist';

if (!is_dir($dist)) { fwrite(STDERR, "No dist/ folder: run npm run build first.\n"); exit(1); }
if (!is_dir($cdn) && !@mkdir($cdn, 02750, true)) { fwrite(STDERR, "Cannot create {$cdn}\n"); exit(1); }

$copy = function (string $from, string $to): void {
    if (!@copy($from, $to)) { fwrite(STDERR, "Cannot write {$to}: check the permissions.\n"); exit(1); }
    @chmod($to, 0640);
};

$versions = [];
foreach (glob($dist . '/*', GLOB_ONLYDIR) as $dir) {
    $v = basename($dir);
    if (!preg_match('/^\d+\.\d+\.\d+$/', $v)) continue;
    $manifestFile = "$dir/checksums-$v.json";
    $manifest = is_file($manifestFile) ? json_decode((string) file_get_contents($manifestFile), true) : null;
    if (!is_array($manifest['files'] ?? null) || !$manifest['files']) { fwrite(STDERR, "dist/$v: no checksums-$v.json, skipped\n"); continue; }

    // 1. The build itself must match its fingerprints.
    foreach ($manifest['files'] as $name => $hash) {
        if (!is_file("$dir/$name") || hash_file('sha256', "$dir/$name") !== $hash) {
            fwrite(STDERR, "dist/$v/$name does not match its fingerprint: build damaged, nothing published.\n");
            exit(1);
        }
    }
    $versions[$v] = $manifest['files'];

    // 2. Already on the CDN?
    $target = "$cdn/$v";
    $state = 'new';
    if (is_dir($target)) {
        $state = 'same';
        foreach ($manifest['files'] as $name => $hash) {
            if (!is_file("$target/$name")) { $state = 'partial'; continue; }
            if (hash_file('sha256', "$target/$name") !== $hash) { $state = 'different'; break; }
        }
    }
    if ($state === 'same') { echo "up to date   $v\n"; continue; }
    if ($state === 'different' && !$force) {
        fwrite(STDERR, "REFUSED      $v: the CDN already has other files under this number.\n");
        fwrite(STDERR, "             A published version never changes: bump the version, or rerun with --force if you are sure.\n");
        exit(1);
    }

    // 3. Copy, then check what landed.
    if (!is_dir($target)) { @mkdir($target, 02750, true); }
    foreach (array_keys($manifest['files']) as $name) $copy("$dir/$name", "$target/$name");
    $copy($manifestFile, "$target/checksums-$v.json");
    foreach ($manifest['files'] as $name => $hash) {
        if (hash_file('sha256', "$target/$name") !== $hash) { fwrite(STDERR, "Copy of $v/$name is wrong on the CDN.\n"); exit(1); }
    }
    echo "published    $v  (" . count($manifest['files']) . " files)\n";
}

if (!$versions) { fwrite(STDERR, "No version to publish in dist/.\n"); exit(1); }

// 4. v<major>/ follows the latest release of each major version.
$latest = [];
foreach (array_keys($versions) as $v) {
    $major = (int) $v;
    if (!isset($latest[$major]) || version_compare($v, $latest[$major], '>')) $latest[$major] = $v;
}
foreach ($latest as $major => $v) {
    $alias = "$cdn/v$major";
    if (!is_dir($alias)) @mkdir($alias, 02750, true);
    $changed = false;
    foreach ($versions[$v] as $name => $hash) {
        if (is_file("$alias/$name") && hash_file('sha256', "$alias/$name") === $hash) continue;
        $copy("$cdn/$v/$name", "$alias/$name");
        $changed = true;
    }
    echo ($changed ? "alias        v$major -> $v\n" : "alias        v$major = $v (unchanged)\n");
}
