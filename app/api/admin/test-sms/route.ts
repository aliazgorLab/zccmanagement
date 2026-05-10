import { NextRequest, NextResponse } from "next/server";
import { sendTestSMS } from "@/lib/sms";



export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const phoneRaw = String(body?.phone ?? "").trim();

    if (!phoneRaw) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const result = await sendTestSMS(phoneRaw);

    if (result.response_code !== 202) {
      // Return provider's error_message when available for frontend visibility
      const errorMessage = result.error_message ?? "Failed to send test SMS";
      return NextResponse.json({ success: false, error_message: errorMessage, raw: result.rawBody }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: result.success_message ?? "Test SMS sent" });
  } catch (error) {
    console.error("[admin/test-sms] Error:", error);
    return NextResponse.json({ error: "Failed to send test SMS", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}