/**
 * SMS utility — server-side only.
 * Uses the BulkSMSBD API to send transactional SMS messages.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeBangladeshiNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `88${digits}`;
  return `88${digits}`;
}

function maskCredential(value: string): string {
  if (!value || value.length < 4) return "***";
  return value.substring(0, 4) + "***";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BulkSmsResponse = {
  response_code?: number;
  success_message?: string;
  error_message?: string;
  rawBody: string;
};

// ---------------------------------------------------------------------------
// Core sender
// ---------------------------------------------------------------------------

export async function sendSMS(
  phone: string,
  message: string
): Promise<BulkSmsResponse> {
  const apiKey = process.env.BULKSMSBD_API_KEY; // The long secret key
  const uid = process.env.BULKSMSBD_UID;     // Your username (e.g., imd.zahidul58)
  const senderId = process.env.BULKSMSBD_SENDER_ID || "8801844532630";
  const apiUrl = process.env.BULKSMSBD_API_URL || "https://bulksmsbd.net/api/smsapi";

  const missing: string[] = [];
  if (!apiKey) missing.push("BULKSMSBD_API_KEY");
  if (!uid) missing.push("BULKSMSBD_UID");

  if (missing.length > 0) {
    console.error(`[SMS] Missing env var(s): ${missing.join(", ")}`);
    return { rawBody: "missing-environment-variables" };
  }

  const normalizedPhone = normalizeBangladeshiNumber(phone);

  // Payload strictly formatted for BulkSMSBD
  const requestBody = new URLSearchParams({
    api_key: apiKey!,           // The long vd8o... key goes here
    senderid: senderId,          // 8801844532630
    number: normalizedPhone,
    message: message
  }).toString();

  // 10-second timeout to prevent 502 Bad Gateway
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: requestBody,
      signal: controller.signal
    });
  } catch (networkErr: any) {
    clearTimeout(timeoutId);
    console.error("[SMS] Network error or timeout:", networkErr);
    const errorMsg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    return {
      rawBody: errorMsg,
      error_message: `Fetch failed: ${errorMsg}`,
      response_code: 500
    };
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();

  let parsed: { response_code?: number; success_message?: string; error_message?: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("[SMS] Non-JSON response:", text);
    return { rawBody: text };
  }

  if (parsed.response_code === 202) {
    console.log(`[SMS] ✓ Sent to ${normalizedPhone}:`, parsed.success_message);
    return { ...parsed, rawBody: text };
  }

  console.error(`[SMS] ✗ Error for ${normalizedPhone}:`, parsed.error_message ?? text);
  return { ...parsed, rawBody: text };
}

// ---------------------------------------------------------------------------
// High-level helpers
// ---------------------------------------------------------------------------

/**
 * Sends a payment/admission confirmation SMS to the student AND the Admin.
 */
export async function sendPaymentSMS(
  phone: string,
  name: string,
  amount: number,
  remainingDue: number,
  studentId?: string
): Promise<void> {
  const studentMessage = `Dear ${name}, ৳${amount} received for Zahids Chem Clinic. Your remaining due is ৳${remainingDue}. Help Line: 01841783983`;

  const adminNumber = "01912886558";
  const idText = studentId ? ` (ID: ${studentId})` : "";
  const adminMessage = `Payment Alert: ৳${amount} received from ${name}${idText}. Remaining Due: ৳${remainingDue}.`;

  try {
    const promises = [];

    if (phone && phone.trim().length >= 10) {
      promises.push(
        sendSMS(phone, studentMessage).then((res) =>
          console.log("[SMS] Student notification status:", res.success_message || "Failed")
        )
      );
    }

    promises.push(
      sendSMS(adminNumber, adminMessage).then((res) =>
        console.log("[SMS] Admin notification status:", res.success_message || "Failed")
      )
    );

    await Promise.allSettled(promises);

  } catch (error) {
    console.error("[SMS] Failed to trigger dual SMS:", error);
  }
}

/**
 * Sends a simple test SMS so admins can verify BulkSMSBD credentials.
 */
export async function sendTestSMS(phone: string): Promise<BulkSmsResponse> {
  try {
    return await sendSMS(phone, "Hello from ZCC — test message.");
  } catch (error) {
    console.error("[SMS] Failed to send test SMS:", error);
    return { rawBody: error instanceof Error ? error.message : "unknown-error" };
  }
}