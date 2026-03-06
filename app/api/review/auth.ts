/**
 * Builds auth headers for the Permission Protocol CLI API.
 *
 * Requires PP_TENANT_ID and PP_CLI_API_KEY environment variables.
 * Returns an empty object when credentials are missing so callers
 * can safely spread the result into a headers object.
 */
export function getPPAuthHeaders(): Record<string, string> {
  const tenantId = process.env.PP_TENANT_ID;
  const cliApiKey = process.env.PP_CLI_API_KEY;

  if (!tenantId || !cliApiKey) {
    return {};
  }

  const basic = Buffer.from(`${tenantId}:${cliApiKey}`).toString("base64");
  return {
    Authorization: `Basic ${basic}`,
    "X-Tenant-Id": tenantId,
  };
}
