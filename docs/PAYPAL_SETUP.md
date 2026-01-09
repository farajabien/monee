# PayPal Integration Setup Guide

Monee now uses PayPal for $10 one-time payments. This guide will help you set up PayPal integration from scratch.

---

## Prerequisites

- PayPal Developer account
- Sandbox credentials for testing
- Live credentials for production

---

## Step 1: Get PayPal Credentials

### For Testing (Sandbox)

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Log in with your PayPal account
3. Navigate to **Apps & Credentials**
4. Under **Sandbox**, click **Create App**
5. Name your app (e.g., "Monee Sandbox")
6. Click **Create App**
7. Copy the **Client ID** and **Secret** shown on the next page

### For Production (Live)

1. In the same dashboard, switch to **Live** tab
2. Click **Create App**
3. Name your app (e.g., "Monee Live")
4. Click **Create App**
5. Copy the **Live Client ID** and **Secret**

---

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Add your PayPal credentials to `.env.local`:

   **For Sandbox Testing:**
   ```bash
   PAYPAL_CLIENT_ID=your_sandbox_client_id
   PAYPAL_CLIENT_SECRET=your_sandbox_secret
   PAYPAL_MODE=sandbox
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   **For Production:**
   ```bash
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_secret
   PAYPAL_MODE=live
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_live_client_id
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

---

## Step 3: Test in Sandbox

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Navigate to the checkout page:
   ```
   http://localhost:3000/checkout
   ```

3. Click the PayPal button

4. Use PayPal Sandbox test accounts to complete payment:
   - **Buyer account**: Use a sandbox buyer account (create one in PayPal Developer Dashboard if needed)
   - **Test payment**: Complete the payment flow

5. Verify payment capture:
   - Check your console logs for payment confirmation
   - Check InstantDB to see if `hasPaid` is set to `true`

---

## Step 4: Set Up Webhooks (Optional but Recommended)

Webhooks act as a failsafe if the client-side capture fails (e.g., user closes browser).

1. In PayPal Developer Dashboard, go to **Webhooks**
2. Click **Add Webhook**
3. Enter your webhook URL:
   - **Sandbox**: `http://localhost:3000/api/webhooks/paypal` (use ngrok or similar for local testing)
   - **Live**: `https://yourdomain.com/api/webhooks/paypal`

4. Select these events to subscribe to:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.REFUNDED` (optional)

5. Copy the **Webhook ID** and add it to `.env.local`:
   ```bash
   PAYPAL_WEBHOOK_ID=your_webhook_id
   ```

---

## Step 5: Switch to Live Mode

When you're ready to accept real payments:

1. Update `.env.local` with **live credentials**:
   ```bash
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_secret
   PAYPAL_MODE=live
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_live_client_id
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. Test with your own credit card first to verify everything works

3. Monitor the first 10-20 payments closely

---

## Payment Flow

### Client-Side Flow

1. User clicks **PayPal button** on `/checkout`
2. `PaymentButton` calls `createPaymentOrder()` server action
3. Server creates $10 order with PayPal API (price is validated on server)
4. PayPal order ID is returned to client
5. PayPal popup opens for user to complete payment
6. User approves payment
7. `PaymentButton` calls `capturePayment()` server action
8. Server captures payment and marks user as paid in InstantDB
9. User redirected to `/dashboard`

### Webhook Failsafe

If the client-side capture fails (browser closed, network error, etc.):

1. PayPal sends `PAYMENT.CAPTURE.COMPLETED` webhook to `/api/webhooks/paypal`
2. Webhook handler extracts `profileId` from order reference
3. Marks user as paid in InstantDB
4. User can refresh and access dashboard

---

## Troubleshooting

### "PayPal credentials not configured"

- Check that `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are in `.env.local`
- Restart your dev server after adding environment variables

### "Failed to create order"

- Verify you're using the correct credentials for the mode (`sandbox` or `live`)
- Check console logs for detailed error messages
- Ensure your PayPal app is active in the dashboard

### Payment succeeds but user not marked as paid

- Check webhook logs in PayPal dashboard
- Verify webhook URL is reachable
- Check database for `hasPaid` field
- Contact user and manually verify payment in PayPal dashboard, then update DB manually if needed

### Testing with sandbox account

- Create sandbox accounts in PayPal Developer Dashboard under **Sandbox > Accounts**
- Use the **Personal** account to test as a buyer
- Default password is usually the same as the email or shown in dashboard

---

## Security Notes

✅ **Order creation happens on server** - prevents price tampering
✅ **Payment capture verified on server** - ensures payment completed
✅ **Webhook failsafe** - catches payments if client fails
✅ **Environment variables** - keeps credentials secure

---

## Support

If you encounter issues:

1. Check [PayPal Developer Documentation](https://developer.paypal.com/docs/api/overview/)
2. Review console logs for detailed error messages
3. Test with sandbox first before going live
4. Check InstantDB for data consistency

---

## Pricing

- **Amount**: $10 USD (one-time)
- **Currency**: USD
- **Description**: "Monee - Simple Money Tracker (Lifetime Access)"
- **No subscription** - single payment only

To change the price, update `MONEE_PRICE` in `app/actions/payment.ts` (line 10).

---

## Files Reference

- `lib/paypal.ts` - PayPal SDK setup and helper functions
- `app/actions/payment.ts` - Server actions for order creation/capture
- `components/payment-button.tsx` - PayPal button component
- `app/(app)/checkout/page.tsx` - Checkout page UI
- `app/api/webhooks/paypal/route.ts` - Webhook handler
- `.env.local` - Environment variables (not in git)
- `.env.example` - Template for environment variables

---

Ready to accept payments! 🎉
