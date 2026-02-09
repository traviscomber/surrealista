#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

console.log('Verifying Next.js project setup...');
console.log(`Project root: ${projectRoot}`);

const checks = [
  { name: 'app directory', path: path.join(projectRoot, 'app') },
  { name: 'app/layout.tsx', path: path.join(projectRoot, 'app', 'layout.tsx') },
  { name: 'app/page.tsx', path: path.join(projectRoot, 'app', 'page.tsx') },
  { name: 'package.json', path: path.join(projectRoot, 'package.json') },
  { name: 'next.config.mjs', path: path.join(projectRoot, 'next.config.mjs') },
  { name: 'tsconfig.json', path: path.join(projectRoot, 'tsconfig.json') },
];

let allPass = true;
checks.forEach(check => {
  const exists = fs.existsSync(check.path);
  const status = exists ? '✓' : '✗';
  console.log(`${status} ${check.name}`);
  if (!exists) allPass = false;
});

if (allPass) {
  console.log('\n✓ All required files are present!');
  process.exit(0);
} else {
  console.error('\n✗ Some required files are missing!');
  process.exit(1);
}
