import { NextResponse } from "next/server";
import { fetchReceiptViewData } from "@/src/lib/receiptData";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const receipt = await fetchReceiptViewData(params.id);
    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }

    return NextResponse.json(receipt, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to fetch receipt.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
