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
  status_code?: number;
  status?: string;
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
  const apiKey = process.env.BULKSMSBD_API_KEY?.trim();
  const senderId = process.env.BULKSMSBD_SENDER_ID?.trim();
  const endpointUrl = process.env.BULKSMSBD_API_URL?.trim() || "https://smsplus.sslwireless.com/api/v3/send-sms";

  const missing: string[] = [];
  if (!apiKey) missing.push("BULKSMSBD_API_KEY");
  if (!senderId) missing.push("BULKSMSBD_SENDER_ID");

  if (missing.length > 0) {
    console.error(`[SMS] Missing env var(s): ${missing.join(", ")}`);
    return { rawBody: "missing-environment-variables" };
  }

  const normalizedPhone = normalizeBangladeshiNumber(phone);
  const csmsId = `ZCC-${Date.now()}`;
  const bodyPayload = {
    api_token: apiKey!,
    sid: senderId!,
    msisdn: normalizedPhone,
    sms: message,
    csms_id: csmsId
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  let text = "";

  try {
    console.log("[SMS] Sending request to:", {
      url: endpointUrl,
      api_token: maskCredential(apiKey!),
      sid: senderId,
      msisdn: normalizedPhone,
      sms: message,
      csms_id: csmsId,
    });

    response = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    text = await response.text();
  } catch (networkErr: any) {
    console.error("[SMS] Network error or timeout:", networkErr);
    const errorMsg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    return {
      rawBody: errorMsg,
      error_message: `Fetch failed: ${errorMsg}`,
      status_code: 500,
    };
  } finally {
    clearTimeout(timeoutId);
  }

  // Log provider response for debugging
  console.log(`[SMS] Provider response for ${normalizedPhone} (status ${response.status}):`, text);

  // Try to parse JSON; if parsing fails, log the raw body and return a safe provider error.
  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch (parseErr) {
    console.error("[SMS] Provider returned a non-JSON response:", text);
    return {
      rawBody: text,
      status_code: response.status,
      error_message: "Provider returned an invalid response",
    };
  }

  // Ensure parsed is non-null for TypeScript and downstream logic
  const parsedObj = parsed ?? { error_message: text, status_code: response.status };

  if (!response.ok || parsedObj.status_code !== 200 || parsedObj.status !== "SUCCESS") {
    console.error("[SMS] Provider failure:", {
      status_code: parsedObj.status_code ?? response.status,
      status: parsedObj.status,
      error_message: parsedObj.error_message ?? text,
    });
    return {
      rawBody: text,
      status_code: parsedObj.status_code ?? response.status,
      status: parsedObj.status,
      error_message: parsedObj.error_message ?? text,
    };
  }

  console.log("[SMS] Provider success:", {
    status_code: parsedObj.status_code,
    status: parsedObj.status,
    success_message: parsedObj.success_message ?? "(no success_message)",
  });

  return {
    rawBody: text,
    status_code: parsedObj.status_code,
    status: parsedObj.status,
    success_message: parsedObj.success_message,
    error_message: parsedObj.error_message,
  };
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