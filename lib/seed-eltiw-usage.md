# ELTIW Seed Data Usage

This guide explains how to seed sample ELTIW (Every Little Thing I Want) items for testing.

## Quick Start

### Option 1: Using Browser Console

1. Open your app in the browser
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to the Console tab
4. Run the following:

```javascript
// Import the seed function
import { seedEltiw } from './lib/seed-eltiw';

// Get your profile ID from the app state or database
const profileId = 'your-profile-id-here';

// Seed the data
await seedEltiw({ profileId });
```

### Option 2: Add to Settings Page

You can add a "Seed Sample Data" button to your Settings page for easy access during development.

### Option 3: Run from Onboarding

Add seed data automatically when a new user completes onboarding (optional for development).

## Sample Data Included

The seed function creates 16 wishlist items:

### Want Items (8 items)
**Tech:**
- MacBook Pro M3 (KSh 250,000)
- iPhone 15 Pro (KSh 150,000)
- AirPods Max (KSh 65,000)
- iPad Pro (KSh 120,000)

**Lifestyle:**
- Car Down Payment (KSh 500,000)
- Vacation to Maldives (KSh 300,000)
- New L-Shape Sofa (KSh 85,000)
- Gaming Setup - PS5 + TV (KSh 150,000)

### Got Items (8 items)
**Tech:**
- Sony WH-1000XM5 Headphones (KSh 45,000)
- Apple Watch Series 9 (KSh 55,000)
- Samsung 4K Monitor (KSh 35,000)
- Mechanical Keyboard (KSh 15,000)

**Lifestyle:**
- Weekend Getaway - Diani (KSh 40,000)
- Gym Membership Annual (KSh 25,000)
- New Wardrobe (KSh 50,000)
- Dining Table Set (KSh 60,000)

## Functions Available

### `seedEltiw({ profileId })`
Seeds all sample ELTIW items for the given profile.

```typescript
import { seedEltiw } from '@/lib/seed-eltiw';

await seedEltiw({ profileId: 'user-profile-id' });
```

### `clearEltiw({ profileId })`
Removes all ELTIW items for the given profile (useful for testing).

```typescript
import { clearEltiw } from '@/lib/seed-eltiw';

await clearEltiw({ profileId: 'user-profile-id' });
```

## Notes

- All items are marked with `category: "purchase"`
- Items are dated randomly within the last 90 days
- "Got" items have a `gotDate` set
- All items include a note indicating they're seeded data
