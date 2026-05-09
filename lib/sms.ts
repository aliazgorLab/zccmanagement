/**
 * SMS utility — server-side only.
 * Uses the BulkSMSBD REST API to send transactional SMS messages.
 * API key and sender ID are read from environment variables and are
 * never exposed to the frontend.
 */

const BULKSMSBD_API_URL = "https://bulksmsbd.net/api/smsapi";

/**
 * Low-level helper: sends a single SMS via BulkSMSBD.
 * Returns true on success, false on any failure (network or API).
 */
async function sendSMS(phone: string, message: string): Promise<boolean> {
  const apiKey = process.env.BULKSMSBD_API_KEY;
  const senderId = process.env.BULKSMSBD_SENDER_ID;

  if (!apiKey || !senderId) {
    console.error(
      "[SMS] BULKSMSBD_API_KEY or BULKSMSBD_SENDER_ID is not set in environment variables."
    );
    return false;
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    type: "text",
    number: phone,
    senderid: senderId,
    message,
  });

  const response = await fetch(`${BULKSMSBD_API_URL}?${params.toString()}`, {
    method: "GET",
  });

  const text = await response.text();

  // BulkSMSBD returns a JSON body; a response_code of 202 means success.
  let parsed: { response_code?: number; success_message?: string; error_message?: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    // Non-JSON response — treat as an error.
    console.error("[SMS] Unexpected non-JSON response from BulkSMSBD:", text);
    return false;
  }

  if (parsed.response_code === 202) {
    console.log(`[SMS] Sent successfully to ${phone}:`, parsed.success_message);
    return true;
  }

  console.error(
    `[SMS] BulkSMSBD returned error for ${phone}: code=${parsed.response_code} — ${parsed.error_message ?? text}`
  );
  return false;
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
