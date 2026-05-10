/**
 * SMS utility — server-side only.
 * Uses the BulkSMSBD / SSL Wireless API to send transactional SMS messages.
 * API credentials and sender ID are read from environment variables and are
 * never exposed to the frontend.
 */

const BULKSMSBD_API_URL = "https://bulksmsbd.net/api/smsapi";

function normalizeBangladeshiNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("880")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `88${digits}`;
  }

  return `88${digits}`;
}

type BulkSmsResponse = {
  response_code?: number;
  success_message?: string;
  error_message?: string;
  rawBody: string;
};

/**
 * Low-level helper: sends a single SMS via BulkSMSBD.
 * Returns true on success, false on any failure (network or API).
 */
export async function sendSMS(phone: string, message: string): Promise<BulkSmsResponse> {
  const apiKey = process.env.BULKSMSBD_API_KEY;
  const apiSecret = process.env.BULKSMSBD_SECRET_KEY;
  const senderId = process.env.BULKSMSBD_SENDER_ID;
  const normalizedPhone = normalizeBangladeshiNumber(phone);

  if (!apiKey || !apiSecret || !senderId) {
    console.error(
      "[SMS] BULKSMSBD_API_KEY, BULKSMSBD_SECRET_KEY, or BULKSMSBD_SENDER_ID is not set in environment variables."
    );
    return { rawBody: "missing-environment-variables" };
  }

  const payload = {
    api_key: apiKey,
    api_secret: apiSecret,
    sender_id: senderId,
    message,
    mobile_no: normalizedPhone,
  };

  const response = await fetch(BULKSMSBD_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  // BulkSMSBD returns a JSON body; a response_code of 202 means success.
  let parsed: { response_code?: number; success_message?: string; error_message?: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    // Non-JSON response — treat as an error.
    console.error("[SMS] Unexpected non-JSON response from BulkSMSBD:", text);
    return { rawBody: text };
  }

  if (parsed.response_code === 202) {
    console.log(`[SMS] Sent successfully to ${normalizedPhone}:`, parsed.success_message);
    return { ...parsed, rawBody: text };
  }

  console.error(
    `[SMS] BulkSMSBD returned error for ${normalizedPhone}: code=${parsed.response_code} — ${parsed.error_message ?? text}`
  );
  return { ...parsed, rawBody: text };
}

/**
 * Sends a payment confirmation SMS to a student.
 *
 * @param phone        - Recipient's phone number (Bangladeshi format).
 * @param name         - Student's name.
 * @param amount       - Amount received in this transaction (৳).
 * @param remainingDue - Outstanding balance after this payment (৳).
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
    // Never crash the main request — just log so we can investigate balance/config issues.
    console.error("[SMS] Failed to send payment SMS:", error);
  }
}

/**
 * Sends a simple test SMS so admins can verify BulkSMSBD credentials.
 */
export async function sendTestSMS(phone: string): Promise<BulkSmsResponse> {
  try {
    return await sendSMS(phone, "Hello from ZCC");
  } catch (error) {
    console.error("[SMS] Failed to send test SMS:", error);
    return { rawBody: error instanceof Error ? error.message : "unknown-error" };
  }
}
