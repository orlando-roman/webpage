import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');

test('preview preserves content and routes without inviting indexing', () => {
  execFileSync(process.execPath, ['scripts/build.mjs']);
  for (const page of ['index.html', 'home/index.html', 'research/index.html', 'cv/index.html', 'contact/index.html']) {
    const html = read(`dist/${page}`);
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/www\.orlandoroman\.com\//);
    assert.match(html, /<main id="main"/);
  }
  const content = JSON.parse(read('content/site.json'));
  const research = read('dist/research/index.html');
  assert.equal((research.match(/data-abstract-toggle/g) || []).length, 11);
  for (const paper of content.papers) {
    assert.ok(research.includes(paper.abstract.slice(0, 80)), `Missing abstract for ${paper.id}`);
    assert.ok(research.includes(`id="abstract-${paper.id}"`));
    for (const link of paper.links) assert.ok(research.includes(link.url.replaceAll('&', '&amp;')));
  }
  assert.ok(!existsSync('dist/CNAME'), 'A preview must not claim the live domain');
  assert.ok(!existsSync('dist/content/site.json'), 'Publish only the generated website');
});

test('production enables indexing and uses only the established domain', () => {
  execFileSync(process.execPath, ['scripts/build.mjs', '--production']);
  const html = read('dist/index.html');
  assert.doesNotMatch(html, /noindex/);
  assert.equal(read('dist/CNAME').trim(), 'www.orlandoroman.com');
  assert.match(read('dist/robots.txt'), /Sitemap: https:\/\/www\.orlandoroman\.com\/sitemap.xml/);
  const sitemap = read('dist/sitemap.xml');
  assert.equal((sitemap.match(/<loc>/g) || []).length, 4);
  assert.doesNotMatch(sitemap, /github\.io|localhost|\/home/);
  execFileSync(process.execPath, ['scripts/build.mjs']);
  assert.ok(!existsSync('dist/CNAME'), 'Switching back to preview removes production-only files');
});
