"use client";

import { PayPalButtons } from "@paypal/react-paypal-js";
import { createPaymentOrder, capturePayment } from "@/app/actions/payment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PaymentButtonProps {
  profileId: string;
  userId: string;
  onSuccess?: () => void;
}

export function PaymentButton({
  profileId,
  userId,
  onSuccess,
}: PaymentButtonProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto">
      {isProcessing && (
        <div className="text-center mb-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground mt-2">
            Processing payment...
          </p>
        </div>
      )}

      <PayPalButtons
        style={{
          layout: "vertical",
          shape: "rect",
          label: "pay",
          height: 48,
        }}
        // 1. Create Order on server
        createOrder={async (data, actions) => {
          try {
            setIsProcessing(true);

            // Call server action to create order (prevents price tampering)
            const result = await createPaymentOrder(userId, profileId);

            if (!result.success || !result.orderId) {
              throw new Error(result.error || "Failed to create order");
            }

            return result.orderId;
          } catch (err) {
            console.error("[PayPal] Create order error:", err);
            toast.error("Failed to initialize payment. Please try again.");
            setIsProcessing(false);
            throw err;
          }
        }}
        // 2. On Approve (user authorized payment)
        onApprove={async (data, actions) => {
          try {
            const { orderID } = data;

            // Call server action to capture the payment
            const result = await capturePayment(orderID, profileId);

            setIsProcessing(false);

            if (result.success) {
              toast.success(result.message || "Payment successful! Welcome to Monee.");

              // Call optional success callback
              if (onSuccess) {
                onSuccess();
              }

              // Redirect to dashboard after short delay
              setTimeout(() => {
                router.push("/dashboard");
                router.refresh(); // Refresh to update payment status
              }, 1500);
            } else {
              toast.error(result.error || "Payment capture failed");
            }

            // Show warning if DB update failed but payment succeeded
            if (result.warning) {
              toast.warning(result.warning, { duration: 8000 });
            }
          } catch (err) {
            console.error("[PayPal] Capture error:", err);
            toast.error("An error occurred during payment. Please contact support.");
            setIsProcessing(false);
          }
        }}
        // 3. Handle Cancel
        onCancel={() => {
          toast.info("Payment cancelled. You can try again anytime.");
          setIsProcessing(false);
        }}
        // 4. Handle Error
        onError={(err) => {
          console.error("[PayPal] Button error:", err);
          toast.error("PayPal error occurred. Please try again or contact support.");
          setIsProcessing(false);
        }}
      />

      {/* Alternative Payment Methods hint */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>Pay securely with PayPal or Card</p>
        <p className="mt-1">No PayPal account required</p>
      </div>
    </div>
  );
}
