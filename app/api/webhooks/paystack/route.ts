import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/instant-admin";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: {
      userId?: string;
      productName?: string;
      custom_fields?: Array<{
        display_name: string;
        variable_name: string;
        value: string;
      }>;
    };
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: Record<string, unknown>;
      risk_action: string;
    };
  };
}

export async function POST(req: Request) {
  try {
    // Verify Paystack signature
    const headersList = await headers();
    const signature = headersList.get("x-paystack-signature");
    
    if (!signature) {
      console.error("No signature found in webhook request");
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 401 }
      );
    }

    const body = await req.text();
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse the webhook event
    const event: PaystackWebhookEvent = JSON.parse(body);

    console.log("Paystack webhook received:", event.event, event.data.reference);

    // Handle successful charge
    if (event.event === "charge.success") {
      const { data } = event;
      const userId = data.metadata?.userId || 
                    data.metadata?.custom_fields?.find(f => f.variable_name === "user_id")?.value;

      if (!userId) {
        console.error("No userId found in webhook metadata");
        return NextResponse.json(
          { error: "Missing userId in metadata" },
          { status: 400 }
        );
      }

      // Check for duplicate payment reference
      try {
        // Query users to check if this payment reference already exists
        const { $users } = await adminDb.query({
          $users: {
            $: {
              where: {
                paystackReference: data.reference,
              },
            },
          },
        });

        if ($users && $users.length > 0) {
          console.log(`⚠️ Duplicate payment webhook for reference: ${data.reference}`);
          return NextResponse.json({
            success: true,
            message: "Payment already processed (duplicate webhook)",
            duplicate: true,
          });
        }

        // Also check if the user already has a different payment
        const { $users: userCheck } = await adminDb.query({
          $users: {
            $: {
              where: {
                id: userId,
              },
            },
          },
        });

        const user = userCheck?.[0];
        if (user?.hasPaid && user.paystackReference && user.paystackReference !== data.reference) {
          console.log(`⚠️ User ${userId} already has a payment: ${user.paystackReference}`);
          return NextResponse.json({
            success: true,
            message: "User already has an active payment",
            duplicate: true,
          });
        }

        // Update user payment status in InstantDB
        await adminDb.transact([
          adminDb.tx.$users[userId].update({
            hasPaid: true,
            paymentDate: new Date(data.paid_at).getTime(),
            paystackReference: data.reference,
          }),
        ]);

        console.log(`✅ Payment verified for user ${userId}: ${data.reference}`);
        
        return NextResponse.json({
          success: true,
          message: "Payment verified and user updated",
        });
      } catch (error) {
        console.error("Failed to update user in database:", error);
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }
    }

    // Handle other events (optional logging)
    if (event.event === "charge.failed") {
      console.log("Payment failed:", event.data.reference, event.data.gateway_response);
    }

    // Return success for all webhook events
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
