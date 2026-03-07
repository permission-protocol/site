import { NextResponse } from "next/server";
import { getPPAuthHeaders } from "../../auth";
import { PP_BASE_URL } from "../../lib/shared";

/**
 * Thin proxy to PP API merge endpoint.
 * All merge logic lives in the backend (Breakout-Labs).
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeaders = await getPPAuthHeaders();
    const res = await fetch(`${PP_BASE_URL}/deploy-requests/${params.id}/merge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders,
      },
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      return NextResponse.json(
        { error: (data.error as string) ?? (data.message as string) ?? "Merge failed.", details: data },
        { status: res.status }
      );
    }

    // Map backend response to frontend's expected shape
    const mergeResult = (data.merge_result ?? data.post_approval_result ?? {}) as Record<string, unknown>;
    return NextResponse.json({
      merged: mergeResult.status === "success" && !mergeResult.autoMergeEnabled,
      message: (mergeResult.message as string) ?? "Merge completed.",
      auto_merge: mergeResult.autoMergeEnabled
        ? { enabled: true }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to reach PP API.", details: (error as Error).message },
      { status: 502 }
    );
  }
}
