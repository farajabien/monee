import paypal from "@paypal/checkout-server-sdk";

/**
 * PayPal SDK Setup for Monee
 * Handles order creation and payment capture
 */

// 1. Setup the environment (Sandbox or Live)
function getPayPalEnvironment() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const mode = process.env.PAYPAL_MODE || "sandbox";

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured. Check your .env.local file.");
  }

  return mode === "live"
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

// 2. Export the client instance
export const paypalClient = new paypal.core.PayPalHttpClient(
  getPayPalEnvironment()
);

/**
 * Helper to create a PayPal order
 * @param amount - The amount to charge (e.g., 10.00)
 * @param currency - Currency code (default: USD)
 * @param referenceId - Your internal reference (e.g., userId or profileId)
 */
export async function createPayPalOrder(
  amount: number,
  currency: string = "USD",
  referenceId?: string
) {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");

  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: referenceId, // Your internal ID (userId or profileId)
        amount: {
          currency_code: currency,
          value: amount.toFixed(2), // Ensure string format "10.00"
        },
        description: "Monee - Simple Money Tracker (Lifetime Access)",
      },
    ],
    application_context: {
      user_action: "PAY_NOW",
      brand_name: "MONEE",
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
    },
  });

  const order = await paypalClient.execute(request);
  return {
    orderId: order.result.id,
    links: order.result.links,
  };
}

/**
 * Helper to capture a PayPal payment after user approval
 * @param orderId - The PayPal order ID to capture
 */
export async function capturePayPalPayment(orderId: string) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody(Object.create(null)); // fix for SDK type issue

  const capture = await paypalClient.execute(request);
  const captureData = capture.result.purchase_units[0].payments.captures[0];

  return {
    captureId: captureData.id,
    status: capture.result.status, // "COMPLETED"
    payerId: capture.result.payer.payer_id,
    payerEmail: capture.result.payer.email_address,
    referenceId: capture.result.purchase_units[0].reference_id,
  };
}
