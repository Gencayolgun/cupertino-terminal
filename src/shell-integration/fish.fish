function __cupertino_prompt_event --on-event fish_prompt
    set -l exit_code $status
    printf '\e]133;D;%d\a\e]133;A\a\e]7;file://%s%s\a' $exit_code (hostname) $PWD
end

function __cupertino_preexec --on-event fish_preexec
    printf '\e]133;C\a'
end
