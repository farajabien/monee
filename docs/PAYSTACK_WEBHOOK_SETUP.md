# Paystack Webhook Setup Guide

This guide explains how to set up Paystack webhooks to verify payments server-side.

## Why Use Webhooks?

Webhooks provide server-side payment verification, which is more secure than relying solely on client-side callbacks. Benefits include:

- ✅ **Security**: Server verifies payments using Paystack's signature
- ✅ **Reliability**: Handles cases where client callbacks fail
- ✅ **Audit Trail**: Server logs all payment events
- ✅ **Fraud Prevention**: Cryptographic signature verification

## Webhook Endpoint

The webhook is implemented at:
```
POST /api/webhooks/paystack
```

## Local Development Setup

### 1. Install ngrok (for local testing)

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

### 2. Start your development server

```bash
pnpm dev
```

### 3. Expose local server with ngrok

```bash
ngrok http 3000
```

You'll get a URL like: `https://abc123.ngrok.io`

### 4. Configure Paystack Webhook

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
2. Navigate to **Settings** → **Webhooks**
3. Add your ngrok URL: `https://abc123.ngrok.io/api/webhooks/paystack`
4. Copy the webhook secret (if provided) - though we use the secret key for verification

## Production Setup

### 1. Deploy your application

Deploy to Vercel, Railway, or your hosting provider.

Example deployment URL: `https://monee.vercel.app`

### 2. Configure Paystack Webhook

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
2. Navigate to **Settings** → **Webhooks**
3. Add your production URL: `https://monee.vercel.app/api/webhooks/paystack`
4. Select events to listen to:
   - `charge.success` (required)
   - `charge.failed` (optional, for logging)

### 3. Update Environment Variables

Make sure your production environment has:

```env
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key
INSTANT_APP_ADMIN_TOKEN=your_instantdb_admin_token
NEXT_PUBLIC_INSTANT_APP_ID=your_instantdb_app_id
```

⚠️ **Important**: Switch from test keys (`sk_test_...`) to live keys (`sk_live_...`) in production!

## How It Works

### Payment Flow

1. **User clicks "Pay"** → Client opens Paystack popup
2. **User completes payment** → Paystack processes payment
3. **Client callback fires** → Updates user status immediately (fast UX)
4. **Webhook fires** → Server verifies and updates status (secure backup)

### Webhook Event Structure

```json
{
  "event": "charge.success",
  "data": {
    "reference": "monee_user123_1234567890",
    "amount": 99900,
    "currency": "KES",
    "status": "success",
    "paid_at": "2025-11-21T10:30:00.000Z",
    "metadata": {
      "userId": "user123",
      "productName": "MONEE Full Access",
      "custom_fields": [
        {
          "display_name": "User ID",
          "variable_name": "user_id",
          "value": "user123"
        }
      ]
    },
    "customer": {
      "email": "user@example.com"
    }
  }
}
```

## Testing the Webhook

### Test Card Details

Use Paystack test cards:

```
Card Number: 4084 0840 8408 4081
CVV: 408
Expiry: Any future date
PIN: 0000
OTP: 123456
```

### Verify Webhook Logs

Check your application logs for:

```
✅ Payment verified for user abc123: monee_abc123_1234567890
```

### Test Webhook Manually

You can test the webhook endpoint directly:

```bash
# Generate signature
echo -n '{"event":"charge.success","data":{"reference":"test"}}' | \
  openssl dgst -sha512 -hmac "your_secret_key" | \
  awk '{print $2}'

# Send test request
curl -X POST https://your-domain.com/api/webhooks/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: generated_signature" \
  -d '{"event":"charge.success","data":{"reference":"test","metadata":{"userId":"test123"},"paid_at":"2025-11-21T10:30:00.000Z"}}'
```

## Security Features

### Signature Verification

The webhook verifies every request using HMAC-SHA512:

```typescript
const hash = crypto
  .createHmac("sha512", PAYSTACK_SECRET_KEY)
  .update(body)
  .digest("hex");

if (hash !== signature) {
  return error("Invalid signature");
}
```

This ensures:
- Requests come from Paystack
- Payload hasn't been tampered with
- Protects against replay attacks

### Error Handling

The webhook handles various error cases:
- Missing signature → 401 Unauthorized
- Invalid signature → 401 Unauthorized
- Missing userId → 400 Bad Request
- Database errors → 500 Internal Server Error

## Monitoring & Debugging

### Check Webhook Deliveries

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
2. Navigate to **Webhooks** tab
3. View webhook delivery history
4. Check response codes and retry status

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check `PAYSTACK_SECRET_KEY` is correct |
| 400 Bad Request | Ensure `userId` is in payment metadata |
| 500 Server Error | Check `INSTANT_APP_ADMIN_TOKEN` is valid |
| Webhook not firing | Verify URL in Paystack dashboard |
| ngrok connection refused | Ensure dev server is running on port 3000 |

### Enable Debug Logging

The webhook includes console logs for debugging:

```typescript
console.log("Paystack webhook received:", event.event, event.data.reference);
console.log(`✅ Payment verified for user ${userId}: ${data.reference}`);
```

Check your server logs (Vercel logs, Railway logs, etc.) for these messages.

## Additional Resources

- [Paystack Webhooks Documentation](https://paystack.com/docs/payments/webhooks/)
- [Paystack API Reference](https://paystack.com/docs/api/)
- [InstantDB Admin API](https://www.instantdb.com/docs/admin)
- [ngrok Documentation](https://ngrok.com/docs)

## Support

For issues with:
- Paystack integration → [support@paystack.com](mailto:support@paystack.com)
- InstantDB → [Discord Community](https://discord.gg/instantdb)
- MONEE app → Create an issue on GitHub
