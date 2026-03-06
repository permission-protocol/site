import { NextResponse } from "next/server";
import { getPPAuthHeaders } from "../auth";

const PP_BASE_URL = process.env.PP_API_URL || "https://app.permissionprotocol.com/api/v1";

const STATUSES = ["pending", "approved", "denied", "expired", "superseded", "cancelled"];

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const debug: any[] = [];
  try {
    const authHeaders = getPPAuthHeaders();
    debug.push({ authHeadersPresent: !!authHeaders.Authorization, ppApiUrl: PP_BASE_URL });

    for (const status of STATUSES) {
      const url = `${PP_BASE_URL}/deploy-requests?status=${status}&limit=100`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...authHeaders,
        },
        cache: "no-store",
      });

      debug.push({ status, httpStatus: response.status, ok: response.ok });

      if (!response.ok) continue;

      const data = await response.json().catch(() => null);
      if (!data) {
        debug.push({ status, parseError: true });
        continue;
      }

      const requests = data.requests || [];
      if (data.groups) {
        for (const group of data.groups) {
          if (group.requests) requests.push(...group.requests);
          if (group.items) requests.push(...group.items);
        }
      }

      debug.push({ status, requestCount: requests.length, firstId: requests[0]?.id });

      const match = requests.find((r: any) => r.id === params.id);
      if (match) {
        return NextResponse.json(match);
      }
    }

    return NextResponse.json({ error: "Request not found.", debug, searchedId: params.id }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to fetch request details.", details: (error as Error).message, debug },
      { status: 500 }
    );
  }
}
