#!/usr/bin/env bash
set -euo pipefail

pubkey_file=${1:-}
if [ -z "$pubkey_file" ] || [ ! -r "$pubkey_file" ]; then
  echo "usage: sudo $0 /path/to/claude_debug_key.pub" >&2
  exit 2
fi
if [ "$(wc -l < "$pubkey_file")" -gt 1 ] || ! grep -q '^ssh-' "$pubkey_file"; then
  echo "$pubkey_file does not look like a single OpenSSH public key" >&2
  exit 2
fi

user_name=claude-debug
home_dir=/home/$user_name
wrapper=/usr/local/bin/claude-debug-cmd

# Installed before the key is authorised, so there is never a window where the key is live
# without its forced command. Root-owned and not writable by claude-debug -- a wrapper the
# guarded user can edit is not a guard.
install -m 755 -o root -g root "$(dirname "$0")/claude-debug-cmd.sh" "$wrapper"

# Rotating the key is routine, so every step has to be safe to repeat: useradd on an existing
# user exits 9 and, under set -e, would abort before the new key was written.
id -u "$user_name" >/dev/null 2>&1 || useradd -m -s /bin/bash "$user_name"

# Granted because the wrapper needs it to read container state. This group is root-equivalent;
# the wrapper, not this line, is what keeps the key read-only.
usermod -aG docker "$user_name"

install -d -m 700 -o "$user_name" -g "$user_name" "$home_dir/.ssh"

# Overwritten, not appended: appending leaves the previous key authorised after a rotation.
# `restrict` also switches off pty, port/agent/X11 forwarding and ~/.ssh/rc (OpenSSH >= 7.2).
printf 'restrict,command="%s" %s\n' "$wrapper" "$(cat "$pubkey_file")" \
  > "$home_dir/.ssh/authorized_keys"
chmod 600 "$home_dir/.ssh/authorized_keys"
chown "$user_name:$user_name" "$home_dir/.ssh/authorized_keys"

echo "provisioned $user_name with forced command $wrapper"
