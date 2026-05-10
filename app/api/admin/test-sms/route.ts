import { NextRequest, NextResponse } from "next/server";
import { sendTestSMS } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const phone = String(body?.phone ?? "").trim();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const result = await sendTestSMS(phone);
    console.log("[admin/test-sms] BulkSMSBD response:", result);

    if (result.response_code !== 202) {
      return NextResponse.json(
        { error: "Failed to send test SMS" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test SMS sent successfully",
    });
  } catch (error) {
    console.error("[admin/test-sms] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to send test SMS",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}