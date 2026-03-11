import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_CONTACT_WEBHOOK;
const DISCORD_THREAD_ID = process.env.DISCORD_CONTACT_THREAD_ID;

type ContactPayload = {
  name?: string;
  email?: string;
  company?: string;
  useCase?: string;
  environment?: string;
  message?: string;
  utm?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toFieldValue = (value: string) => value || "N/A";
const getSourceValue = (utm?: ContactPayload["utm"]) => {
  const source = utm?.utm_source?.trim() ?? "";
  const campaign = utm?.utm_campaign?.trim() ?? "";

  if (!source && !campaign) {
    return null;
  }

  return campaign ? `${source || "unknown"} / ${campaign}` : source;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload;
    const name = body?.name?.trim();
    const email = body?.email?.trim()?.toLowerCase();
    const company = body?.company?.trim() ?? "";
    const useCase = body?.useCase?.trim() ?? "";
    const environment = body?.environment?.trim() ?? "";
    const message = body?.message?.trim() ?? "";
    const sourceValue = getSourceValue(body?.utm);

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const ts = new Date().toISOString();

    console.log(`[contact] ${name} <${email}> at ${ts}`);

    if (DISCORD_WEBHOOK_URL) {
      const webhookUrl = DISCORD_THREAD_ID
        ? `${DISCORD_WEBHOOK_URL}?thread_id=${DISCORD_THREAD_ID}`
        : DISCORD_WEBHOOK_URL;
      await fetch(webhookUrl, {
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
              ...(sourceValue ? [{ name: "Source", value: sourceValue, inline: true }] : []),
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
