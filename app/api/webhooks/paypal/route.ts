import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

/**
 * PayPal Webhook Handler
 * Acts as a failsafe if the client-side onApprove never fires
 * (e.g., user closes browser immediately after approving payment)
 */

export async function POST(request: NextRequest) {
  try {
    // Parse webhook body
    const body = await request.json();

    console.log("[Webhook] Received PayPal webhook:", body.event_type);

    // Handle payment capture completion
    if (body.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const captureId = body.resource.id;
      const orderId =
        body.resource.supplementary_data?.related_ids?.order_id || null;

      // Extract reference_id (profileId) from custom_id or purchase_units
      const referenceId = body.resource.custom_id ||
        body.resource.purchase_units?.[0]?.reference_id;

      console.log(`[Webhook] Payment captured:`, {
        captureId,
        orderId,
        referenceId,
      });

      // If we have a reference (profileId), mark user as paid
      if (referenceId) {
        try {
          const now = Date.now();

          await db.transact([
            db.tx.profiles[referenceId].update({
              hasPaid: true,
              paidAt: now,
              paypalOrderId: orderId,
              paypalCaptureId: captureId,
            }),
          ]);

          console.log(
            `[Webhook] ✅ Marked profile ${referenceId} as paid via webhook`
          );
        } catch (dbError) {
          console.error("[Webhook] Failed to update database:", dbError);
          // Don't return error - payment succeeded, DB issue is logged
        }
      } else {
        console.warn(
          "[Webhook] ⚠️  No reference_id found in webhook payload. Manual verification may be needed."
        );
      }
    }

    // Handle refund (optional)
    if (body.event_type === "PAYMENT.CAPTURE.REFUNDED") {
      const captureId = body.resource.id;
      console.log(`[Webhook] Payment refunded: ${captureId}`);

      // TODO: Optionally mark user as unpaid or track refund
      // For now, we'll just log it
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    // Still return 200 to prevent PayPal from retrying
    return NextResponse.json(
      { received: true, error: "Processing error" },
      { status: 200 }
    );
  }
}

// Prevent Next.js from caching webhook responses
export const dynamic = "force-dynamic";
