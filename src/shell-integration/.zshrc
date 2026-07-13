autoload -Uz add-zsh-hook
_cupertino_precmd() {
  local exit_code=$?
  printf '\e]133;D;%d\a\e]133;A\a\e]7;file://%s%s\a' "$exit_code" "$HOST" "$PWD"
}
add-zsh-hook precmd _cupertino_precmd
_cupertino_esc=$'\e'
_cupertino_bel=$'\a'
PROMPT="${PROMPT}%{${_cupertino_esc}]133;B${_cupertino_bel}%}"
unset _cupertino_esc _cupertino_bel
