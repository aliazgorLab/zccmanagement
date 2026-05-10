import { NextRequest, NextResponse } from "next/server";

const BULKSMSBD_API_URL = "https://bulksmsbd.net/api/smsapi";

function normalizeBangladeshiNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `88${digits}`;
  return `88${digits}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const phoneRaw = String(body?.phone ?? "").trim();

    if (!phoneRaw) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const apiKey = process.env.BULKSMSBD_API_KEY;
    const senderId = process.env.BULKSMSBD_SENDER_ID;

    if (!apiKey || !senderId) {
      console.error("[admin/test-sms] Missing BULKSMSBD_API_KEY or BULKSMSBD_SENDER_ID");
      return NextResponse.json({ error: "SMS configuration missing on server" }, { status: 500 });
    }

    const number = normalizeBangladeshiNumber(phoneRaw);
    const message = "Hello from ZCC";

    const payload = {
      api_key: apiKey,
      senderid: senderId,
      number,
      message,
    };

    const response = await fetch(BULKSMSBD_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Log entire raw response for Vercel debugging
    const rawText = await response.text();
    console.log("BulkSMS Response:", rawText);

    // Try to parse provider response to extract error_message / success
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // keep parsed null
    }

    if (!response.ok || parsed?.response_code !== 202) {
      // Return provider's error_message when available for frontend visibility
      const errorMessage = parsed?.error_message ?? parsed?.message ?? "Failed to send test SMS";
      return NextResponse.json({ success: false, error_message: errorMessage, raw: rawText }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: parsed?.success_message ?? "Test SMS sent" });
  } catch (error) {
    console.error("[admin/test-sms] Error:", error);
    return NextResponse.json({ error: "Failed to send test SMS", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}