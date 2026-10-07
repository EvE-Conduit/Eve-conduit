/** Human text for ?error= codes the SSO callback redirects back with. */
export const SSO_ERRORS: Record<string, string> = {
  sso_cancelled: "Login was cancelled at EVE Online.",
  sso_failed: "EVE Online didn't confirm the login. Please try again.",
  character_owned_elsewhere: "That character is already linked to a different account here.",
  sso_not_configured: "EVE login isn't set up on this server yet.",
};
