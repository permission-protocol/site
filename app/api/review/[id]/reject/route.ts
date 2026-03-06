import { NextResponse } from "next/server";

const PP_BASE_URL = process.env.PP_API_URL || "https://app.permissionprotocol.com/api/v1";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json().catch(() => ({}))) as { reason?: string };

    const rejectResponse = await fetch(`${PP_BASE_URL}/requests/${params.id}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        rejected_by: "reviewer",
        reason: body.reason
      })
    });

    const rejectData = (await rejectResponse.json().catch(() => ({}))) as { error?: string };
    if (!rejectResponse.ok) {
      const errorMessage =
        rejectResponse.status === 409 ? "This request was already decided." : rejectData.error ?? "Rejection failed.";
      return NextResponse.json({ error: errorMessage, details: rejectData }, { status: rejectResponse.status || 500 });
    }

    return NextResponse.json({
      success: true,
      ...rejectData
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to reject request.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
