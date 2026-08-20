#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const packageRoot = path.resolve(__dirname, '..');
const packageJson = require(path.join(packageRoot, 'package.json'));
const podspecName = packageJson.name;

function exists(filePath) {
  return fs.existsSync(filePath);
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function write(filePath, contents) {
  fs.writeFileSync(filePath, contents);
}

function findAppRoot(startDir) {
  let current = startDir;

  while (true) {
    const podfile = path.join(current, 'ios', 'Podfile');
    if (exists(podfile)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }

    current = parent;
  }
}

function insertAfterFirst(contents, marker, insertion) {
  const index = contents.indexOf(marker);
  if (index === -1) {
    return null;
  }

  return contents.slice(0, index + marker.length) + insertion + contents.slice(index + marker.length);
}

function ensurePodfile(contents) {
  let next = contents;
  let changed = false;

  const readiumSource = "source 'https://github.com/readium/podspecs'";
  if (!next.includes(readiumSource)) {
    next = `${readiumSource}\n${next}`;
    changed = true;
  }

  const requirePods = `require_relative '../node_modules/${podspecName}/scripts/readium_pods'`;
  const requirePostInstall = `require_relative '../node_modules/${podspecName}/scripts/readium_post_install'`;
  const requireInsertion = `\n${requirePods}\n${requirePostInstall}\n`;
  const requireMarker = ").strip\n";
  if (!next.includes(requirePods)) {
    const updated = insertAfterFirst(next, requireMarker, requireInsertion);
    if (updated) {
      next = updated;
      changed = true;
    }
  }

  if (!/\breadium_pods\b/.test(next)) {
    const updated = next.replace(/\n(\s*)post_install do \|installer\|/, '\n$1readium_pods\n\n$1post_install do |installer|');
    if (updated !== next) {
      next = updated;
      changed = true;
    }
  }

  if (!next.includes('readium_post_install(installer)')) {
    const updated = next.replace(
      /(\n\s*react_native_post_install\([\s\S]*?\n\s*\)\n)/,
      '$1\n    readium_post_install(installer)\n'
    );
    if (updated !== next) {
      next = updated;
      changed = true;
    }
  }

  return { contents: next, changed };
}

function hasPodCommand() {
  const result = spawnSync('pod', ['--version'], {
    stdio: 'ignore',
    windowsHide: true,
  });
  return result.status === 0;
}

function ensureSymlink(linkPath, targetPath) {
  if (exists(linkPath) || !exists(targetPath)) {
    return false;
  }

  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  const type = process.platform === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(targetPath, linkPath, type);
  return true;
}

if (exists(path.join(packageRoot, 'apps', 'example-native'))) {
  process.exit(0);
}

const appRoot = findAppRoot(packageRoot);
if (!appRoot) {
  process.exit(0);
}

const podfilePath = path.join(appRoot, 'ios', 'Podfile');
if (!exists(podfilePath)) {
  process.exit(0);
}

const currentPodfile = read(podfilePath);
const { contents: nextPodfile, changed } = ensurePodfile(currentPodfile);
const reactNativeNitroModulesTarget = path.dirname(
  require.resolve('react-native-nitro-modules/package.json', { paths: [packageRoot] })
);
const reactNativeNitroModulesLink = path.join(appRoot, 'node_modules', 'react-native-nitro-modules');
const linkedNitroModules = ensureSymlink(reactNativeNitroModulesLink, reactNativeNitroModulesTarget);
const didWork = changed || linkedNitroModules;

if (didWork) {
  if (changed) {
    write(podfilePath, nextPodfile);
    process.stdout.write('[react-native-readium-updated] Updated ios/Podfile for automatic Readium setup.\n');
  }
  if (linkedNitroModules) {
    process.stdout.write('[react-native-readium-updated] Linked react-native-nitro-modules into the app node_modules folder.\n');
  }
  if (hasPodCommand()) {
    try {
      execFileSync('pod', ['install'], {
        cwd: path.join(appRoot, 'ios'),
        stdio: 'inherit',
      });
    } catch (error) {
      process.stderr.write('[react-native-readium-updated] Automatic CocoaPods install failed. Check your CocoaPods setup and rerun the install command.\n');
    }
  } else {
    process.stderr.write('[react-native-readium-updated] CocoaPods was not found, so iOS pods could not be installed automatically.\n');
  }
}
