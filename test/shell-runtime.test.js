'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { prepareZshRuntime, buildShellLaunch } = require('../src/shell-runtime');

test('zsh runtime lives in writable user data and chains every login startup file', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cupertino-zsh-'));
  const runtime = prepareZshRuntime({ userDataDir: root, originalZdotdir: '/Users/test', hookFile: '/Applications/Cupertino.app/hook.zsh' });
  assert.ok(runtime.startsWith(root));
  for (const name of ['.zshenv', '.zprofile', '.zshrc', '.zlogin', '.zlogout']) assert.ok(fs.existsSync(path.join(runtime, name)), name);
  const zshrc = fs.readFileSync(path.join(runtime, '.zshrc'), 'utf8');
  assert.match(zshrc, /_cupertino_original_zdotdir='\/Users\/test'/);
  assert.match(zshrc, /ZDOTDIR="\$_cupertino_original_zdotdir"/);
  assert.match(zshrc, /ZDOTDIR="\$_cupertino_runtime_zdotdir"/);
  assert.match(zshrc, /HISTFILE='\/Users\/test\/\.zsh_history'/);
  assert.doesNotMatch(zshrc, /AppTranslocation|app\.asar\.unpacked/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('zsh launch points ZDOTDIR at user data, never packaged resources', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cupertino-launch-'));
  const result = buildShellLaunch({
    profile: { command: 'zsh', args: ['-l'] }, cwd: '/tmp', platform: 'darwin',
    env: { HOME: '/Users/test' }, version: '1.0.0', userDataDir: root, integrationDir: '/read-only/app.asar.unpacked/src/shell-integration',
  });
  assert.ok(result.env.ZDOTDIR.startsWith(root));
  assert.deepEqual(result.args, ['-l']);
  fs.rmSync(root, { recursive: true, force: true });
});

test('WSL keeps the directory requested by Explorer instead of forcing home', () => {
  const result = buildShellLaunch({
    profile: { command: 'wsl.exe', args: [] }, cwd: 'C:\\Work\\repo', platform: 'win32',
    env: {}, version: '1.0.0', userDataDir: 'C:\\Data', integrationDir: 'C:\\App',
  });
  assert.deepEqual(result.args, ['--cd', 'C:\\Work\\repo']);
});

test('macOS GUI shells receive Homebrew paths and fish integration', () => {
  const result = buildShellLaunch({
    profile: { command: 'fish', args: ['-l'] }, cwd: '/tmp', platform: 'darwin',
    env: { PATH: '/custom/bin' }, version: '1.0.0', userDataDir: '/tmp/data', integrationDir: '/Applications/Cupertino/shell-integration',
  });
  assert.match(result.env.PATH, /^\/opt\/homebrew\/bin:/);
  assert.match(result.env.PATH, /\/custom\/bin/);
  assert.deepEqual(result.args.slice(0, 2), ['-l', '-C']);
  assert.match(result.args[2], /fish\.fish/);
});
