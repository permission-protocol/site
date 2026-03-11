import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_CONTACT_WEBHOOK;

type ContactPayload = {
  name?: string;
  email?: string;
  company?: string;
  useCase?: string;
  environment?: string;
  message?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toFieldValue = (value: string) => value || "N/A";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload;
    const name = body?.name?.trim();
    const email = body?.email?.trim()?.toLowerCase();
    const company = body?.company?.trim() ?? "";
    const useCase = body?.useCase?.trim() ?? "";
    const environment = body?.environment?.trim() ?? "";
    const message = body?.message?.trim() ?? "";

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const ts = new Date().toISOString();

    console.log(`[contact] ${name} <${email}> at ${ts}`);

    if (DISCORD_WEBHOOK_URL) {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: "🔥 New Contact Form Submission",
            color: 0xFF6B35,
            fields: [
              { name: "Name", value: name, inline: true },
              { name: "Email", value: email, inline: true },
              { name: "Company", value: toFieldValue(company), inline: true },
              { name: "Use Case", value: toFieldValue(useCase), inline: true },
              { name: "Environment", value: toFieldValue(environment), inline: true },
              { name: "Message", value: toFieldValue(message) },
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
