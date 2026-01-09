"use server";

import { createPayPalOrder, capturePayPalPayment } from "@/lib/paypal";
import db from "@/lib/db";
import { id } from "@instantdb/admin";

/**
 * MONEE Payment Actions
 * Handles PayPal order creation and capture for $10 one-time payment
 */

// Price constant - single source of truth
const MONEE_PRICE = 10.0; // USD
const MONEE_CURRENCY = "USD";

/**
 * Step 1: Create PayPal Order
 * Called when user clicks the PayPal button
 *
 * @param userId - The authenticated user's ID
 * @param profileId - The profile to associate payment with
 * @returns PayPal order ID
 */
export async function createPaymentOrder(userId: string, profileId: string) {
  try {
    // Validate inputs
    if (!userId || !profileId) {
      throw new Error("User ID and Profile ID are required");
    }

    // TODO: Optional - Check if user already paid
    // const { data } = await db.query({
    //   profiles: {
    //     $: { where: { id: profileId } }
    //   }
    // });
    // if (data?.profiles?.[0]?.hasPaid) {
    //   throw new Error("You've already purchased Monee!");
    // }

    // Create PayPal Order (server-side validation prevents price tampering)
    const { orderId } = await createPayPalOrder(
      MONEE_PRICE,
      MONEE_CURRENCY,
      profileId // Use profileId as reference for linking payment
    );

    console.log(`[Payment] Created order ${orderId} for profile ${profileId}`);

    // Return order ID to client for PayPal button flow
    return { success: true, orderId };
  } catch (error) {
    console.error("[Payment] Create order error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create order",
    };
  }
}

/**
 * Step 2: Capture Payment
 * Called after user approves payment in PayPal popup
 *
 * @param orderId - PayPal order ID to capture
 * @param profileId - Profile to mark as paid
 * @returns Success status
 */
export async function capturePayment(orderId: string, profileId: string) {
  try {
    // Validate inputs
    if (!orderId || !profileId) {
      throw new Error("Order ID and Profile ID are required");
    }

    // 1. Capture the payment through PayPal
    const result = await capturePayPalPayment(orderId);

    if (result.status === "COMPLETED") {
      // 2. Update profile in InstantDB - mark as paid
      const now = Date.now();

      try {
        await db.transact([
          db.tx.profiles[profileId].update({
            hasPaid: true,
            paidAt: now,
            paypalOrderId: orderId,
            paypalCaptureId: result.captureId,
            paypalPayerId: result.payerId,
            paypalPayerEmail: result.payerEmail,
          }),
        ]);

        console.log(
          `[Payment] ✅ Captured ${orderId} and marked profile ${profileId} as paid`
        );

        return {
          success: true,
          message: "Payment successful! Welcome to Monee.",
        };
      } catch (dbError) {
        // Log database error but payment still went through
        console.error("[Payment] DB update failed after capture:", dbError);

        // Payment succeeded but DB update failed - manual verification needed
        return {
          success: true,
          warning: "Payment successful, but account activation pending. Contact support if not activated within 5 minutes.",
        };
      }
    }

    // Payment not completed
    return {
      success: false,
      error: "Payment was not completed. Please try again.",
    };
  } catch (error) {
    console.error("[Payment] Capture error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to capture payment",
    };
  }
}

/**
 * Check if a profile has paid
 * @param profileId - Profile ID to check
 * @returns Payment status
 */
export async function checkPaymentStatus(profileId: string) {
  try {
    const { data } = await db.query({
      profiles: {
        $: { where: { id: profileId } },
      },
    });

    const profile = data?.profiles?.[0];

    if (!profile) {
      return { hasPaid: false, error: "Profile not found" };
    }

    return {
      hasPaid: profile.hasPaid || false,
      paidAt: profile.paidAt,
      inTrial: profile.createdAt
        ? Date.now() - profile.createdAt < 7 * 24 * 60 * 60 * 1000 // 7 days
        : false,
    };
  } catch (error) {
    console.error("[Payment] Check status error:", error);
    return { hasPaid: false, error: "Failed to check payment status" };
  }
}
