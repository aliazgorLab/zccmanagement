/**
 * SMS utility — server-side only.
 * Uses the BulkSMSBD API to send transactional SMS messages.
 *
 * Required env vars (set in .env.local):
 *   BULKSMSBD_API_KEY    – BulkSMSBD API key
 *   BULKSMSBD_API_SECRET – BulkSMSBD API secret
 *   BULKSMSBD_SENDER_ID  – registered sender ID (e.g. 8801844532630)
 *   BULKSMSBD_API_URL    – full API endpoint URL
 *
 * Optional env vars:
 *   BULKSMSBD_UID        – numeric user ID (included as `uid` if present)
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeBangladeshiNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0"))   return `88${digits}`;
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

/**
 * Low-level helper: sends a single SMS via BulkSMSBD using
 * application/x-www-form-urlencoded (the format BulkSMSBD requires).
 */
export async function sendSMS(
  phone: string,
  message: string
): Promise<BulkSmsResponse> {
  const apiKey    = process.env.BULKSMSBD_API_KEY;
  const apiSecret = process.env.BULKSMSBD_API_SECRET;
  const senderId  = process.env.BULKSMSBD_SENDER_ID;   // must be 8801844532630
  const apiUrl    = process.env.BULKSMSBD_API_URL;
  const uid       = process.env.BULKSMSBD_UID;         // optional

  // ── Guard: required vars ──────────────────────────────────────────────────
  const missing: string[] = [];
  if (!apiKey)    missing.push("BULKSMSBD_API_KEY");
  if (!apiSecret) missing.push("BULKSMSBD_API_SECRET");
  if (!senderId)  missing.push("BULKSMSBD_SENDER_ID");
  if (!apiUrl)    missing.push("BULKSMSBD_API_URL");

  if (missing.length > 0) {
    console.error(`[SMS] Missing env var(s): ${missing.join(", ")}`);
    return { rawBody: "missing-environment-variables" };
  }

  const normalizedPhone = normalizeBangladeshiNumber(phone);

  // ── Build form-urlencoded payload ─────────────────────────────────────────
  // Mapping based on user's exact instructions:
  // api_key: Username / UID
  // api_secret: The long key (which is currently stored in BULKSMSBD_API_KEY env)
  const requestBody = new URLSearchParams({
    api_key:    uid || "bulksmsbd_user",
    api_secret: apiKey!,                 // The long key starting with vd8o...
    senderid:   "8801844532630",         // Must be exactly the non-masking sender
    number:     normalizedPhone,
    message
  }).toString();

  // ── Debug log (masked) ────────────────────────────────────────────────────
  console.log("[SMS] Sending request →", {
    url:    apiUrl,
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    payload: {
      api_key:    uid || "bulksmsbd_user",
      api_secret: maskCredential(apiKey!),
      senderid:   "8801844532630",
      number:     normalizedPhone,
      message,
    },
  });

  // ── HTTP call with Timeout ────────────────────────────────────────────────
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  let response: Response;
  try {
    response = await fetch(apiUrl!, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    requestBody,
      signal:  controller.signal
    });
  } catch (networkErr: any) {
    clearTimeout(timeoutId);
    console.error("[SMS] Network error or timeout:", networkErr);
    
    // Pass full error message back so UI can display it
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
  console.log("[SMS] Raw response from BulkSMSBD:", text);

  // ── Parse response ────────────────────────────────────────────────────────
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

  console.error(
    `[SMS] ✗ BulkSMSBD error for ${normalizedPhone}: code=${parsed.response_code} — ${parsed.error_message ?? text}`
  );
  return { ...parsed, rawBody: text };
}

// ---------------------------------------------------------------------------
// High-level helpers
// ---------------------------------------------------------------------------

/**
 * Sends a payment confirmation SMS to a student.
 */
export async function sendPaymentSMS(
  phone: string,
  name: string,
  amount: number,
  remainingDue: number
): Promise<void> {
  const message =
    `Dear ${name}, ৳${amount} received for Zahids Chem Clinic. ` +
    `Your remaining due is ৳${remainingDue}. Help Line: 01841783983`;

  try {
    await sendSMS(phone, message);
  } catch (error) {
    console.error("[SMS] Failed to send payment SMS:", error);
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
