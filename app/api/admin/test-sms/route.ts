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

    if (result.error_message === "Provider returned an invalid response") {
      return NextResponse.json(
        { success: false, error: "Provider returned an invalid response" },
        { status: 502 }
      );
    }

    if (result.status_code !== 200 || result.status !== "SUCCESS") {
      const responseText = result.error_message ?? result.rawBody ?? "Failed to send test SMS";
      console.error("[admin/test-sms] Provider error:", {
        status_code: result.status_code,
        status: result.status,
        error_message: result.error_message,
        rawBody: result.rawBody,
      });
      return NextResponse.json({ success: false, error: responseText }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.success_message ?? "Test SMS sent" });
  } catch (error) {
    console.error("[admin/test-sms] Error:", error);
    return NextResponse.json({ error: "Failed to send test SMS", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}