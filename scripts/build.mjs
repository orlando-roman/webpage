import { readFileSync, writeFileSync, mkdirSync, cpSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist');
const production = process.argv.includes('--production');
const data = JSON.parse(readFileSync(resolve(root, 'content/site.json'), 'utf8'));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const write = (path, content) => {
  const destination = resolve(out, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, content);
};
const paragraph = html => `<p>${html}</p>`;
const link = ({ label, url }) => `<a href="${escape(url)}">${escape(label)}</a>`;
const routes = [['Home', '/'], ['Research', '/research/'], ['CV', '/cv/'], ['Contact', '/contact/']];
const descriptions = {
  Home: 'Orlando Roman is an economist at the University of Sydney working on development economics, political economy, and economic history.',
  Research: 'Working papers, research in progress, and policy publications by Orlando Roman, with abstracts and links to papers.',
  CV: 'Curriculum vitae of Orlando Roman, Postdoctoral Research Associate at the University of Sydney.',
  Contact: 'Contact Orlando Roman at the School of Economics, University of Sydney.',
};

function page(name, path, body) {
  const title = name === 'Home' ? data.name : `${data.name} - ${name}`;
  const canonical = data.domain + path;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(descriptions[name] || 'Orlando Roman’s academic website.')}">
  ${production && name !== 'Not found' ? '' : '<meta name="robots" content="noindex, nofollow">'}
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(descriptions[name] || '')}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${data.domain}/assets/portrait.jpg">
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&amp;display=swap">
  <link rel="stylesheet" href="/assets/styles.css">
  <script src="/assets/site.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  <header class="site-header"><div class="header-inner">
    <a class="site-name" href="/">Orlando Roman</a>
    <nav aria-label="Main navigation">${routes.map(([label, href]) => `<a href="${href}"${label === name ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
  </div></header>
  <main id="main" class="${name === 'Home' ? 'home-layout' : name === 'Research' ? 'page-layout research-layout' : name === 'CV' ? 'page-layout cv-layout' : 'page-layout'}">${body}</main>
  <footer class="site-footer">Copyright © ${new Date().getUTCFullYear()} Orlando Roman</footer>
</body>
</html>
`;
}

function paper(entry) {
  return `<article class="paper" id="${entry.id}" aria-labelledby="title-${entry.id}">
    <h3 id="title-${entry.id}">${escape(entry.title)}</h3>
    ${entry.metadata.map(text => `<p class="paper-meta">${text}</p>`).join('')}
    <div class="paper-actions">
      <button type="button" data-abstract-toggle aria-expanded="true" aria-controls="abstract-${entry.id}" aria-label="Abstract: ${escape(entry.title)}" hidden>Abstract</button>
      ${entry.links.map(link).join('')}
    </div>
    <div class="abstract" id="abstract-${entry.id}">${entry.abstract.split('\n\n').map(text => paragraph(escape(text))).join('')}</div>
  </article>`;
}

const home = `<div class="home-photo"><img src="/assets/portrait.jpg" alt="Orlando Roman" width="1280" height="1497" fetchpriority="high"></div>
  <div class="biography"><h1 class="visually-hidden">Orlando Roman</h1>
  ${data.home.map(paragraph).join('')}</div>`;
write('index.html', page('Home', '/', home));
write('home/index.html', page('Home', '/', home));

const sections = [...new Set(data.papers.map(p => p.section))];
const research = `<div class="page-content"><h1 class="visually-hidden">Research</h1>
  <figure class="research-photo"><img src="/assets/mozambique.jpg" alt="Mozambique Island, Mozambique" width="1280" height="324"><figcaption>Mozambique Island, Mozambique, 2016</figcaption></figure>
  ${sections.map((section, i) => `<section class="research-section" aria-labelledby="section-${i}"><h2 id="section-${i}">${section}</h2>${data.papers.filter(p => p.section === section).map(paper).join('')}</section>`).join('')}
</div>`;
write('research/index.html', page('Research', '/research/', research));

write('cv/index.html', page('CV', '/cv/', `<div class="page-content"><h1 class="visually-hidden">Curriculum vitae</h1><figure class="cv-photo"><img src="/assets/coron.jpg" alt="Coron, Philippines" width="1280" height="331"><figcaption>Coron, Philippines, 2022</figcaption></figure><p>Here is my <a href="${escape(data.cv)}">CV</a>.</p></div>`));
write('contact/index.html', page('Contact', '/contact/', `<div class="page-content contact"><h1 class="visually-hidden">Contact</h1><img class="contact-logo" src="/assets/usyd-logo.jpg" width="600" height="600" alt="The University of Sydney"><div class="contact-details"><address>${data.contact.slice(0, 3).map(paragraph).join('')}</address>${data.contact.slice(3).map(paragraph).join('')}</div></div>`));
write('404.html', page('Not found', '/', '<div class="page-content"><h1>Page not found</h1><p>The page you requested could not be found. Visit the <a href="/">homepage</a> or browse my <a href="/research/">research</a>.</p></div>'));
write('.nojekyll', '');
cpSync(resolve(root, 'assets'), resolve(out, 'assets'), { recursive: true });
if (production) {
  write('CNAME', 'www.orlandoroman.com\n');
  write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${data.domain}/sitemap.xml\n`);
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(([, path]) => `<url><loc>${data.domain}${path}</loc></url>`).join('')}</urlset>\n`);
} else {
  for (const name of ['CNAME', 'sitemap.xml']) {
    const target = resolve(out, name);
    if (existsSync(target)) unlinkSync(target);
  }
  // Crawling remains allowed so a public preview's noindex directive can be seen.
  write('robots.txt', 'User-agent: *\nAllow: /\n');
}
console.log(`Built ${production ? 'production' : 'noindex preview'} website in dist/`);
