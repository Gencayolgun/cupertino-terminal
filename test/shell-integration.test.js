const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('zsh hook only emits OSC bytes; runtime wrapper owns user config loading', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell-integration', '.zshrc'), 'utf8');

  assert.doesNotMatch(source, /source .*\.zshrc/, 'user config must be sourced exactly once by the writable runtime wrapper');
  assert.doesNotMatch(source, /PROMPT=.*\$'\\e\]133;B\\a'/, 'quoted ANSI expression would render as prompt text');
  assert.match(source, /PROMPT=.*_cupertino_esc.*\]133;B.*_cupertino_bel/, 'prompt must contain expanded ESC and BEL bytes');
});

test('bash integration preserves login startup precedence and PROMPT_COMMAND arrays', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell-integration', 'bash.bash'), 'utf8');
  assert.match(source, /\.bash_profile/);
  assert.match(source, /\.bash_login/);
  assert.match(source, /\.profile/);
  assert.match(source, /declare -a/);
  assert.match(source, /__cupertino_previous_prompt_commands\[@\]/);
});

test('fish integration emits prompt, command-start and cwd markers', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell-integration', 'fish.fish'), 'utf8');
  assert.match(source, /fish_prompt/);
  assert.match(source, /fish_preexec/);
  assert.match(source, /133;C/);
  assert.match(source, /file:\/\//);
});
