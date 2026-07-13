if [[ -r "$HOME/.bash_profile" ]]; then
  source "$HOME/.bash_profile"
elif [[ -r "$HOME/.bash_login" ]]; then
  source "$HOME/.bash_login"
elif [[ -r "$HOME/.profile" ]]; then
  source "$HOME/.profile"
elif [[ -r "$HOME/.bashrc" ]]; then
  source "$HOME/.bashrc"
fi

if declare -p PROMPT_COMMAND 2>/dev/null | grep -q '^declare -a'; then
  __cupertino_previous_prompt_commands=("${PROMPT_COMMAND[@]}")
else
  __cupertino_previous_prompt_commands=("$PROMPT_COMMAND")
fi
__cupertino_prompt_command() {
  local exit_code=$?
  printf '\e]133;D;%d\a\e]133;A\a\e]7;file://%s%s\a' "$exit_code" "$HOSTNAME" "$PWD"
  local previous
  for previous in "${__cupertino_previous_prompt_commands[@]}"; do
    [[ -n "$previous" && "$previous" != "__cupertino_prompt_command" ]] && eval "$previous"
  done
}
PROMPT_COMMAND=__cupertino_prompt_command
PS1="${PS1}"$'\e]133;B\a'
