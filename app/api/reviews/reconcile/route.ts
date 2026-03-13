import { NextResponse } from "next/server";
import { fetchDeployRequestsByStatuses, fetchGithubPrStatus } from "../../review/lib/shared";

type ReconcileBody = {
  request_ids?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ReconcileBody;
    const requestIds = Array.isArray(body.request_ids)
      ? body.request_ids.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];

    if (requestIds.length === 0) {
      return NextResponse.json({ error: "request_ids must include at least one request id." }, { status: 400 });
    }

    if (requestIds.length > 10) {
      return NextResponse.json({ error: "request_ids may include at most 10 ids." }, { status: 400 });
    }

    const staleIds: string[] = [];
    const requestPool = await fetchDeployRequestsByStatuses(["pending", "approved", "denied", "expired", "superseded", "cancelled"]);
    const requestMap = new Map(requestPool.map((item) => [String(item.id), item]));

    for (const requestId of requestIds) {
      const details = requestMap.get(requestId);
      if (!details?.repo || !details?.prNumber) continue;

      const prStatus = await fetchGithubPrStatus(details.repo, Number(details.prNumber));
      if (!prStatus) continue;

      if (prStatus.merged || prStatus.state === "closed") {
        staleIds.push(requestId);
      }
    }

    return NextResponse.json({ stale_ids: staleIds, checked: requestIds.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to reconcile review requests.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
