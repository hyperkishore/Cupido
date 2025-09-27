#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const docsRoot = path.join(__dirname, '..', 'public', 'docs');
const manifestPath = path.join(docsRoot, 'docs-manifest.json');

function toPosixPath(filepath) {
  return filepath.split(path.sep).join(path.posix.sep);
}

function formatName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\.md$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readMarkdownTitle(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const headingLine = lines.find((line) => /^#\s+/.test(line.trim()));
    if (headingLine) {
      return headingLine.replace(/^#\s+/, '').trim();
    }
  } catch (error) {
    console.warn(`Failed to read title from ${filePath}:`, error.message);
  }
  return formatName(path.basename(filePath));
}

function buildTree(currentDir, relativePathParts = []) {
  const entries = fs
    .readdirSync(currentDir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.DS_Store'))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  const nodes = [];

  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry.name);
    const relativeParts = [...relativePathParts, entry.name];

    if (entry.isDirectory()) {
      const childNodes = buildTree(entryPath, relativeParts);
      if (childNodes.length === 0) {
        continue;
      }
      nodes.push({
        type: 'folder',
        name: entry.name,
        label: formatName(entry.name),
        children: childNodes,
      });
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      const title = readMarkdownTitle(entryPath);
      nodes.push({
        type: 'file',
        name: entry.name,
        label: title,
        path: toPosixPath(path.join(...relativeParts)),
      });
    }
  }

  return nodes;
}

function generateManifest() {
  if (!fs.existsSync(docsRoot)) {
    console.error(`Docs root not found: ${docsRoot}`);
    process.exit(1);
  }

  const categories = fs
    .readdirSync(docsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  const manifest = categories.map((category) => ({
    type: 'category',
    name: category.name,
    label: formatName(category.name),
    children: buildTree(path.join(docsRoot, category.name), [category.name]),
  }));

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Docs manifest generated at ${manifestPath}`);
}

generateManifest();
