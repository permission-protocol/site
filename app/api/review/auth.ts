import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

/**
 * Builds auth headers for the Permission Protocol CLI API.
 *
 * Resolves tenant from the authenticated GitHub org mapping when available.
 * Falls back to PP_TENANT_ID for backward compatibility.
 *
 * Requires PP_CLI_API_KEY and either mapped tenant or PP_TENANT_ID.
 * Returns an empty object when credentials are missing so callers
 * can safely spread the result into a headers object.
 */
export async function getPPAuthHeaders(): Promise<Record<string, string>> {
  const cliApiKey = process.env.PP_CLI_API_KEY;
  if (!cliApiKey) {
    return {};
  }

  let tenantId = process.env.PP_TENANT_ID;

  const session = await getServerSession(authOptions);
  const firstOrg = session?.orgs?.[0];
  if (firstOrg && process.env.TENANT_MAP) {
    try {
      const tenantMap = JSON.parse(process.env.TENANT_MAP) as Record<string, string>;
      const mappedTenant = tenantMap[firstOrg];
      if (mappedTenant) {
        tenantId = mappedTenant;
      }
    } catch {
      // Ignore malformed TENANT_MAP and keep fallback tenant behavior.
    }
  }

  if (!tenantId || !cliApiKey) {
    return {};
  }

  const basic = Buffer.from(`${tenantId}:${cliApiKey}`).toString("base64");
  return {
    Authorization: `Basic ${basic}`,
    "X-Tenant-Id": tenantId,
  };
}
