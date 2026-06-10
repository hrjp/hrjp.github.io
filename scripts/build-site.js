const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const contentDir = path.join(root, "content", "projects");
const publicationsFile = path.join(root, "content", "publications.yml");
const mediaFile = path.join(root, "content", "media.yml");
const creationDir = path.join(root, "creation");
const dataFile = path.join(root, "assets", "project-data.js");
const publicationDataFile = path.join(root, "assets", "publication-data.js");
const mediaDataFile = path.join(root, "assets", "media-data.js");
const projectTemplateFile = path.join(root, "templates", "project-page.html");
const assetVersion = "contact-icons-1";

function countIndent(line) {
  return line.match(/^ */)[0].length;
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === "[]") return [];
  if (trimmed === "{}") return {};
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function splitPair(text) {
  const index = text.indexOf(":");
  if (index === -1) return null;
  return [text.slice(0, index).trim(), text.slice(index + 1).trim()];
}

function parseYaml(source) {
  const lines = source
    .split(/\r?\n/)
    .map((raw) => raw.replace(/\s+$/, ""))
    .filter((raw) => raw.trim() && !raw.trim().startsWith("#"));
  let index = 0;

  function parseBlock(indent) {
    if (index >= lines.length) return {};
    return lines[index].slice(indent).startsWith("- ")
      ? parseArray(indent)
      : parseObject(indent);
  }

  function parseArray(indent) {
    const array = [];
    while (index < lines.length) {
      const line = lines[index];
      const currentIndent = countIndent(line);
      if (currentIndent < indent || !line.slice(indent).startsWith("- ")) break;
      if (currentIndent > indent) {
        throw new Error(`Unexpected indentation: ${line}`);
      }

      const rest = line.slice(indent + 2);
      index += 1;
      if (!rest.trim()) {
        array.push(parseBlock(indent + 2));
        continue;
      }

      const pair = splitPair(rest);
      if (pair) {
        const item = {};
        assignPair(item, pair[0], pair[1], indent + 2);
        while (index < lines.length && countIndent(lines[index]) >= indent + 2) {
          const nestedLine = lines[index];
          if (countIndent(nestedLine) === indent && nestedLine.slice(indent).startsWith("- ")) break;
          const nestedPair = splitPair(nestedLine.slice(indent + 2));
          if (!nestedPair) throw new Error(`Expected key/value pair: ${nestedLine}`);
          index += 1;
          assignPair(item, nestedPair[0], nestedPair[1], indent + 4);
        }
        array.push(item);
      } else {
        array.push(parseScalar(rest));
      }
    }
    return array;
  }

  function parseObject(indent) {
    const object = {};
    while (index < lines.length) {
      const line = lines[index];
      const currentIndent = countIndent(line);
      if (currentIndent < indent) break;
      if (currentIndent > indent) {
        throw new Error(`Unexpected indentation: ${line}`);
      }
      const pair = splitPair(line.slice(indent));
      if (!pair) throw new Error(`Expected key/value pair: ${line}`);
      index += 1;
      assignPair(object, pair[0], pair[1], indent + 2);
    }
    return object;
  }

  function assignPair(object, key, value, childIndent) {
    object[key] = value ? parseScalar(value) : parseBlock(childIndent);
  }

  return parseBlock(0);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTemplate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => escapeHtml(values[key] ?? ""));
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeProject(project, filename) {
  const required = ["id", "slug", "title", "tag", "year", "image", "summary"];
  required.forEach((key) => {
    if (!project[key]) throw new Error(`${filename}: missing "${key}"`);
  });

  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    tag: project.tag,
    year: project.year,
    image: project.image,
    path: `/creation/${project.slug}/`,
    summary: project.summary,
    highlights: ensureArray(project.highlights),
    links: ensureArray(project.links),
    videos: ensureArray(project.videos),
    legacyPaths: ensureArray(project.legacyPaths),
    en: {
      title: project.en?.title || project.title,
      tag: project.en?.tag || project.tag,
      summary: project.en?.summary || project.summary,
      highlights: project.en?.highlights ? ensureArray(project.en.highlights) : ensureArray(project.highlights),
      videos: project.en?.videos ? ensureArray(project.en.videos) : ensureArray(project.videos)
    }
  };
}

function normalizePublication(publication, filename) {
  const required = ["id", "kind", "title", "url"];
  required.forEach((key) => {
    if (!publication[key]) throw new Error(`${filename}: missing "${key}"`);
  });

  if (!["peer", "nonpeer", "award"].includes(publication.kind)) {
    throw new Error(`${filename}: unknown publication kind "${publication.kind}"`);
  }

  return {
    id: publication.id,
    kind: publication.kind,
    title: publication.title,
    url: publication.url,
    authors: ensureArray(publication.authors).map((author) => ({
      name: author.name,
      highlight: author.highlight === true
    })),
    venue: publication.venue || ""
  };
}

function normalizeMediaItem(item, filename) {
  const required = ["id", "kind", "title"];
  required.forEach((key) => {
    if (!item[key]) throw new Error(`${filename}: missing "${key}"`);
  });

  const allowedKinds = ["tv", "book", "web", "magazine", "event", "other"];
  if (!allowedKinds.includes(item.kind)) {
    throw new Error(`${filename}: unknown media kind "${item.kind}"`);
  }

  return {
    id: item.id,
    kind: item.kind,
    date: item.date || "",
    title: item.title,
    outlet: item.outlet || "",
    url: item.url || "",
    description: item.description || "",
    en: {
      kind: item.en?.kind || "",
      title: item.en?.title || item.title,
      outlet: item.en?.outlet || item.outlet || "",
      description: item.en?.description || item.description || ""
    }
  };
}

function writeProjectData(projects) {
  const publicProjects = projects.map(({ legacyPaths, slug, ...project }) => project);
  const js = `window.HRJP_PROJECTS = ${JSON.stringify(publicProjects, null, 2)};\n`;
  fs.writeFileSync(dataFile, js);
}

function writePublicationData(publications) {
  const js = `window.HRJP_PUBLICATIONS = ${JSON.stringify(publications, null, 2)};\n`;
  fs.writeFileSync(publicationDataFile, js);
}

function writeMediaData(mediaItems) {
  const js = `window.HRJP_MEDIA = ${JSON.stringify(mediaItems, null, 2)};\n`;
  fs.writeFileSync(mediaDataFile, js);
}

function writeProjectPages(projects) {
  const template = fs.readFileSync(projectTemplateFile, "utf8");
  fs.mkdirSync(creationDir, { recursive: true });
  projects.forEach((project) => {
    const outDir = path.join(creationDir, project.slug);
    fs.mkdirSync(outDir, { recursive: true });
    const html = renderTemplate(template, {
      id: project.id,
      title: project.title,
      summary: project.summary,
      assetVersion
    });
    fs.writeFileSync(path.join(outDir, "index.html"), html);
  });
}

function writeNotFound(projects) {
  const routes = {};
  projects.forEach((project) => {
    project.legacyPaths.forEach((legacyPath) => {
      routes[legacyPath] = project.path;
      routes[legacyPath.replace(/\/$/, "")] = project.path;
    });
  });

  const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page not found | Shunya Hara</title>
  <meta name="robots" content="noindex">
  <script>
    const routes = ${JSON.stringify(routes, null, 4)};
    const target = routes[decodeURI(location.pathname)];
    if (target) location.replace(target);
  </script>
  <link rel="stylesheet" href="/assets/styles.css?v=${assetVersion}">
</head>
<body>
  <main class="section">
    <p class="eyebrow">Not Found</p>
    <h1>404</h1>
    <p class="lead">ページが見つかりませんでした。</p>
    <a class="button primary" href="/">Home</a>
  </main>
</body>
</html>
`;
  fs.writeFileSync(path.join(root, "404.html"), html);
}

function syncAssetVersions() {
  const htmlFiles = [path.join(root, "index.html")];
  htmlFiles.forEach((file) => {
    const html = fs.readFileSync(file, "utf8").replace(/v=[a-z0-9-]+/g, `v=${assetVersion}`);
    fs.writeFileSync(file, html);
  });
}

function main() {
  const files = fs.readdirSync(contentDir).filter((file) => file.endsWith(".yml")).sort();
  const projects = files.map((file) => {
    const raw = fs.readFileSync(path.join(contentDir, file), "utf8");
    return normalizeProject(parseYaml(raw), file);
  });
  const publications = normalizePublicationList(parseYaml(fs.readFileSync(publicationsFile, "utf8")), "content/publications.yml");
  const mediaItems = normalizeMediaList(parseYaml(fs.readFileSync(mediaFile, "utf8")), "content/media.yml");

  writeProjectData(projects);
  writePublicationData(publications);
  writeMediaData(mediaItems);
  writeProjectPages(projects);
  writeNotFound(projects);
  syncAssetVersions();
  console.log(`Built ${projects.length} projects, ${publications.length} publications, and ${mediaItems.length} media items.`);
}

function normalizePublicationList(value, filename) {
  return ensureArray(value).map((publication) => normalizePublication(publication, filename));
}

function normalizeMediaList(value, filename) {
  return ensureArray(value).map((item) => normalizeMediaItem(item, filename));
}

main();
