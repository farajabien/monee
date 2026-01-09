# PayPal Integration Guide for Next.js App Router

This guide outlines how to implement a robust PayPal payment flow using the PayPal JavaScript SDK on the frontend and the Checkout Server SDK on the backend, exactly as implemented in this project.

## 1. Prerequisites

Install the necessary dependencies:

```bash
npm install @paypal/react-paypal-js @paypal/checkout-server-sdk
# OR
pnpm add @paypal/react-paypal-js @paypal/checkout-server-sdk
```

## 2. Environment Configuration

Add these variables to your `.env.local`:

```bash
# PayPal Configuration
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_MODE=sandbox # Change to 'live' for production
PAYPAL_WEBHOOK_ID=your_webhook_id_here # Optional but recommended
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Your app's URL
```

## 3. Library Setup ([lib/paypal.ts](file:///Users/farajabien/Desktop/ahh%20work/personal/games/fpl-weekly-mvp/lib/paypal.ts))

Create a helper file to configure the PayPal SDK client. Note that while `@paypal/checkout-server-sdk` is technically deprecated in favor of the REST API, it is stable, typed, and works perfectly for this use case.

```typescript
import paypal from "@paypal/checkout-server-sdk";

// 1. Setup the environment (Sandbox or Live)
function getPayPalEnvironment() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const mode = process.env.PAYPAL_MODE || "sandbox";

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
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
 * Helper to create an order
 */
export async function createPayPalOrder(amount: number, currency: string = "USD", referenceId?: string) {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");

  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: referenceId, // Your internal ID
        amount: {
          currency_code: currency,
          value: amount.toFixed(2), // Ensure string format "10.00"
        },
        description: "Your Product Description",
      },
    ],
    application_context: {
      user_action: "PAY_NOW",
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
    },
  });

  const order = await paypalClient.execute(request);
  return {
    orderId: order.result.id,
    links: order.result.links,
  };
}

/**
 * Helper to capture payment
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
  };
}
```

## 4. Server Actions ([app/actions/payment.ts](file:///Users/farajabien/Desktop/ahh%20work/personal/games/fpl-weekly-mvp/app/actions/payment.ts))

Create server actions to handle the secure creation and capture of orders. **Never create orders purely on the client side** to prevent price tampering.

```typescript
'use server';

import { createPayPalOrder, capturePayPalPayment } from '@/lib/paypal';
// Import your DB client here

/**
 * Step 1: Create Order
 * Called when user clicks the PayPal button
 */
export async function createPaymentOrder(userId: string, productId: string) {
  try {
    // 1. Fetch product price from your DB (Source of Truth)
    // const product = await db.products.find(productId);
    const amount = 10.00; // Example hardcoded price

    // 2. Create PayPal Order
    // Pass your internal reference ID (e.g. order ID or user ID)
    const { orderId } = await createPayPalOrder(amount, 'USD', productId);

    // 3. (Optional) Save pending order to your DB
    // await db.orders.create({ status: 'pending', paypalOrderId: orderId, ... });

    // 4. Return the Order ID to the client
    return orderId;
  } catch (error) {
    console.error('Create Order Error:', error);
    throw new Error('Failed to create order');
  }
}

/**
 * Step 2: Capture Order
 * Called after user approves payment in the PayPal popup
 */
export async function capturePayment(orderId: string) {
  try {
    // 1. Capture the payment
    const result = await capturePayPalPayment(orderId);

    if (result.status === 'COMPLETED') {
        // 2. Update your DB - Mark order as paid
        // await db.orders.update({ status: 'paid', captureId: result.captureId ... });
        
        return { success: true };
    }
    
    return { success: false, error: 'Payment not completed' };
  } catch (error) {
    console.error('Capture Error:', error);
    return { success: false, error: 'Capture failed' };
  }
}
```

## 5. Frontend Component ([components/payment-button.tsx](file:///Users/farajabien/Desktop/ahh%20work/personal/games/fpl-weekly-mvp/components/payment-button.tsx))

Use `@paypal/react-paypal-js` to wrap your application or component. This handles the script loading and button rendering.

### Parent Provider (e.g. in `layout.tsx` or a wrapper)
Wrap your app or the payment section with `PayPalScriptProvider`.

```tsx
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export default function PaymentWrapper({ children }) {
  return (
    <PayPalScriptProvider options={{ 
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: "USD",
        intent: "capture"
    }}>
      {children}
    </PayPalScriptProvider>
  );
}
```

### The Button Component

```tsx
'use client';

import { PayPalButtons } from "@paypal/react-paypal-js";
import { createPaymentOrder, capturePayment } from "@/app/actions/payment";
import { toast } from "sonner"; // or your toast library

export function PaymentButton({ productId, userId }: { productId: string, userId: string }) {
  return (
    <PayPalButtons
      style={{ layout: "vertical", shape: "rect" }}
      // 1. Create Order
      createOrder={async (data, actions) => {
        try {
          // Call your server action to create the order
          const orderId = await createPaymentOrder(userId, productId);
          return orderId;
        } catch (err) {
          toast.error("Failed to initialize payment");
          throw err; // Stops the flow
        }
      }}
      // 2. On Approve (User authorized payment)
      onApprove={async (data, actions) => {
        try {
          const { orderID } = data;
          // Call your server action to capture the funds
          const result = await capturePayment(orderID);

          if (result.success) {
            toast.success("Payment successful!");
            // Redirect or update UI
          } else {
            toast.error("Payment failed to capture");
          }
        } catch (err) {
          toast.error("An error occurred during capture");
        }
      }}
      // 3. Handle Cancel/Error
      onCancel={() => toast.info("Payment cancelled")}
      onError={(err) => {
        console.error(err);
        toast.error("PayPal error occurred");
      }}
    />
  );
}
```

## 6. Webhook Handler (Optional but Recommended)

Webhooks act as a failsafe if the client-side `onApprove` never fires (e.g., user closes window immediately).

Create [app/api/webhooks/paypal/route.ts](file:///Users/farajabien/Desktop/ahh%20work/personal/games/fpl-weekly-mvp/app/api/webhooks/paypal/route.ts):

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // 1. Verify headers (Optional in sandbox, required in production)
  // See: https://developer.paypal.com/api/rest/webhooks/rest/

  // 2. Parse body
  const body = await request.json();

  if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const captureId = body.resource.id;
    // const orderId = body.resource.supplementary_data.related_ids.order_id;
    
    // 3. Update DB independently of frontend
    // await db.orders.update({ status: 'paid', captureId: captureId });
    
    console.log('Webhook: Payment captured via webhook:', captureId);
  }

  return NextResponse.json({ received: true });
}
```
