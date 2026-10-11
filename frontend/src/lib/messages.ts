/** Human text for ?error= codes the SSO callback redirects back with. */
export const SSO_ERRORS: Record<string, string> = {
  sso_cancelled: "Login was cancelled at EVE Online.",
  sso_failed: "EVE Online didn't confirm the login. Please try again.",
  character_owned_elsewhere: "That character is already linked to a different account here.",
  sso_not_configured: "EVE login isn't set up on this server yet.",
  insecure: "This site is set up for https:// but was opened over plain http://, so the login can't be kept. Open the https:// address.",
};

/** The command that prints the one-time setup code on each kind of install. */
export const SETUP_CODE_COMMAND: Record<string, { command: string; where: string }> = {
  docker: { command: 'docker compose logs web | grep "setup code"', where: "in the EvE Conduit folder on the server" },
  baremetal: { command: "sudo conduit setup-code", where: "on the server" },
  windows: { command: "conduit setup-code", where: "in an Administrator terminal on the server" },
  dev: { command: "python manage.py conduit_init", where: "in the backend folder" },
};

export function setupCodeCommand(kind: string) {
  return SETUP_CODE_COMMAND[kind] ?? SETUP_CODE_COMMAND.dev;
}
