import { NextResponse } from "next/server";

const PP_BASE_URL = "https://api.permissionprotocol.com/api/v1";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const response = await fetch(`${PP_BASE_URL}/requests/${params.id}`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    const data = (await response.json().catch(() => ({}))) as unknown;

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Request not found." }, { status: 404 });
      }

      return NextResponse.json(
        { error: "Failed to load request details.", details: data },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to fetch request details.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
