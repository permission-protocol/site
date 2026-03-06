import { NextResponse } from "next/server";
import { getPPAuthHeaders } from "../auth";

const PP_BASE_URL = process.env.PP_API_URL || "https://app.permissionprotocol.com/api/v1";

const STATUSES = ["pending", "approved", "denied", "expired", "superseded", "cancelled"];

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const authHeaders = getPPAuthHeaders();

    // The individual request endpoint doesn't support CLI auth,
    // so we query the list endpoint (which does) and filter by ID.
    for (const status of STATUSES) {
      const response = await fetch(
        `${PP_BASE_URL}/deploy-requests?status=${status}&limit=100`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...authHeaders,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) continue;

      const data = await response.json().catch(() => null);
      if (!data) continue;

      // List endpoint returns { requests: [...] } or { groups: [...] }
      const requests = data.requests || [];
      // Also check inside groups if present
      if (data.groups) {
        for (const group of data.groups) {
          if (group.requests) requests.push(...group.requests);
          if (group.items) requests.push(...group.items);
        }
      }

      const match = requests.find((r: any) => r.id === params.id);
      if (match) {
        return NextResponse.json(match);
      }
    }

    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to fetch request details.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
