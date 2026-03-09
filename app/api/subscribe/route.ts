import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_SUBSCRIBE_WEBHOOK;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email?.trim()?.toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const source = req.headers.get("referer")?.includes("/blog") ? "blog" : "footer";
    const ts = new Date().toISOString();

    console.log(`[subscribe] ${email} via ${source} at ${ts}`);

    // Notify Discord
    if (DISCORD_WEBHOOK_URL) {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: "📬 New Subscriber",
            color: 0x44aa99,
            fields: [
              { name: "Email", value: email, inline: true },
              { name: "Source", value: source, inline: true },
            ],
            timestamp: ts,
          }],
        }),
      }).catch(() => {}); // Don't fail the user request if webhook fails
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
// smoke test - deploy gate verification 1773073224
