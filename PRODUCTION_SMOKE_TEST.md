# ToyX — Production Smoke Test

> **Environment**: `https://toyxchange.online`
> **Purpose**: Verify all critical user flows after production deployment
> **Duration**: ~30 minutes
> **Tester**: _________
> **Date**: _________

---

## Test Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Test User A | smoke-a@toyx.test | (shared) | Has listings |
| Test User B | smoke-b@toyx.test | (shared) | Will exchange with A |
| Test User C | smoke-c@toyx.test | (shared) | Fresh account for referral |

---

## 1. Authentication

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 1.1 | Email signup | 1. Visit `/welcome` → "Get Started"<br>2. Fill name, email, password<br>3. Accept terms → Sign Up | Redirected to home, logged in | [ ] |
| 1.2 | Email login | 1. Log out<br>2. Visit `/login`<br>3. Enter email + password → Log In | Redirected to home, logged in | [ ] |
| 1.3 | Google OAuth | Click "Continue with Google" | Login flow completes, redirected to home | [ ] |
| 1.4 | Facebook OAuth | Click "Continue with Facebook" | Login flow completes (if enabled) | [ ] |
| 1.5 | Logout | Click profile → menu → Log Out | Redirected to welcome page, session cleared | [ ] |
| 1.6 | Session persistence | Refresh page while logged in | Stay logged in, no flash of login page | [ ] |

---

## 2. Home Page & Listings

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 2.1 | Home page loads | Navigate to `/` | Toy cards displayed, images load, no blank screen | [ ] |
| 2.2 | Image visibility | Scroll through all carousels | Every toy shows an image (no 🧸 unless toy has no image) | [ ] |
| 2.3 | Boosted items | Check first cards in "For You" | Boosted toys appear at top with "Boosted" badge | [ ] |
| 2.4 | Category browsing | Tap a category chip | Filtered results load correctly | [ ] |
| 2.5 | Pull to refresh | Pull down on home page | Toys refresh without error | [ ] |
| 2.6 | Scroll restoration | Scroll down → tap a toy → go back | Scroll position restored, no skeleton flash | [ ] |

---

## 3. Search

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 3.1 | Text search | Tap search → type "lego" | Matching toys displayed | [ ] |
| 3.2 | Empty search | Type "zzzzzxyzzy" | "No results" state shown | [ ] |
| 3.3 | Category filter | Select a category | Filtered results load | [ ] |

---

## 4. Toy Detail

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 4.1 | Toy detail loads | Tap any toy card | Full detail page with hero image, info, owner | [ ] |
| 4.2 | Image gallery | Swipe hero image | All images navigable | [ ] |
| 4.3 | Share button | Tap Share | Share sheet opens (mobile) or link copied | [ ] |
| 4.4 | Owner profile | Tap owner name | Navigate to owner profile | [ ] |
| 4.5 | Back navigation | Tap back arrow | Returned to previous page | [ ] |
| 4.6 | Unavailable toy | Visit a completed-exchange toy | "Toy No Longer Available" soft state (not 404) | [ ] |

---

## 5. User Profile

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.1 | Own profile | Navigate to `/profile` | Profile loads with stats, toys, reviews tabs | [ ] |
| 5.2 | Toy detail from profile | Tap a toy card | Navigate to toy detail page | [ ] |
| 5.3 | Other user profile | Tap owner name on any toy | Profile loads, toys visible | [ ] |
| 5.4 | Rating display | Check profile with reviews | Star rating + review count displayed | [ ] |

---

## 6. Exchanges

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 6.1 | Initiate exchange | 1. Open a toy (not your own)<br>2. Tap "Request Exchange"<br>3. Select one of your toys<br>4. Add message → Send | Exchange request created | [ ] |
| 6.2 | Exchange notification | Check chat inbox | New exchange appears in list with unread indicator | [ ] |
| 6.3 | Accept exchange | As owner, open exchange → tap "Accept" | Status changes to "accepted", requester gets email | [ ] |
| 6.4 | Exchange cards (role-aware) | Check requester vs owner view | Requester sees "You want" / "You offer"; owner sees "They want" / "They offer" | [ ] |
| 6.5 | Complete exchange | Both users tap "Mark Complete" | Status changes to "completed", toys marked unavailable | [ ] |
| 6.6 | Cancel exchange | Initiate → tap "Cancel" | Exchange canceled, no changes to toy availability | [ ] |

---

## 7. Chat & Messaging

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 7.1 | Inbox loads | Navigate to `/chat` | All exchanges listed, unread indicators | [ ] |
| 7.2 | Send message | Open exchange → type message → send | Message appears, other user sees in real-time | [ ] |
| 7.3 | Emoji reactions | Hover/tap smiley → select emoji | Reaction badge appears below message | [ ] |
| 7.4 | System thread | Check system messages thread | Moderation/safety messages displayed | [ ] |
| 7.5 | Empty state | User with no exchanges | "No conversations yet" displayed | [ ] |

---

## 8. Reviews

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 8.1 | Leave review | After completed exchange, tap "Leave a Review" | Review form appears | [ ] |
| 8.2 | Rating + comment | Select stars + write comment → submit | Review saved, toast confirmed | [ ] |
| 8.3 | Review display | Visit reviewed user's profile | Review visible with rating | [ ] |
| 8.4 | Duplicate prevention | Try reviewing same exchange again | "Already reviewed" state shown | [ ] |

---

## 9. Referrals

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 9.1 | View invite page | Profile → "Invite Friends" | Invite & Earn page loads with all sections | [ ] |
| 9.2 | Copy referral link | Tap copy button | Link copied to clipboard | [ ] |
| 9.3 | Referral attribution | Open incognito → use referral link | Welcome page shows referral banner | [ ] |
| 9.4 | Signup via referral | Complete signup | Referral claimed (check debug endpoint) | [ ] |
| 9.5 | First exchange completes | Referred user completes exchange | Referee gets 100 pts + 7d Premium, referrer gets 200 pts + 7d Premium | [ ] |
| 9.6 | Progress card | Check invite page after referrals | Progress bar updates, completed/pending shown | [ ] |

---

## 10. Premium Pass & Subscription

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 10.1 | Premium Pass display | Check user with active pass | Profile shows "✨ Premium Pass" with expiry date | [ ] |
| 10.2 | Free user display | User without premium | Profile shows "Free / No active subscription / Upgrade" | [ ] |
| 10.3 | Upgrade button | Tap "Upgrade" | Navigates to pricing page | [ ] |
| 10.4 | Subscribe (Paystack) | Complete subscription flow | Plan activated, profile shows Premium | [ ] |
| 10.5 | Premium limits | Premium user creates listings | Can create >5 listings (unlimited) | [ ] |
| 10.6 | Cancel subscription | Profile → Cancel → Confirm | Plan reverts to Free | [ ] |

---

## 11. Paystack Payments

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 11.1 | Initialize payment | Pricing → Subscribe → Monthly | Redirected to Paystack checkout | [ ] |
| 11.2 | Complete payment | Use test card on Paystack | Redirected to `/billing-success` | [ ] |
| 11.3 | Verify success page | After Paystack redirect | "Payment Successful!" shown | [ ] |
| 11.4 | Subscription activation | Check profile after payment | "Premium" with valid until date | [ ] |
| 11.5 | Webhook processing | Check server logs after payment | `[paystack] webhook received: event=subscription.create` | [ ] |
| 11.6 | Cancel subscription | Profile → Cancel | Plan reverts to Free, status = canceled | [ ] |
| 11.7 | Toy boost payment | Boost a toy via Paystack | Toy boosted, badge shows | [ ] |

---

## 12. Email Notifications

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 12.1 | Welcome email | Create new account | Email received with onboarding info | [ ] |
| 12.2 | Exchange request email | Initiate an exchange | Owner receives email notification | [ ] |
| 12.3 | Exchange accepted email | Accept an exchange | Requester receives email | [ ] |
| 12.4 | Support request | Submit support form | Confirmation received? (optional) | [ ] |

---

## 13. Edge Cases

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 13.1 | 404 page | Visit `/nonexistent-page` | "Page not found" rendered | [ ] |
| 13.2 | Network error | Disconnect network → interact | Graceful error messages, no crash | [ ] |
| 13.3 | Blocked user | User A blocks User B | B cannot see A's toys or profile | [ ] |
| 13.4 | Expired session | Wait 24h → refresh | Redirected to login, previous path saved | [ ] |
| 13.5 | Concurrent access | Two users exchange simultaneously | No duplicate exchanges or data loss | [ ] |

---

## Results Summary

| Section | Tests | Passed | Failed | Skipped |
|---------|-------|--------|--------|---------|
| 1. Authentication | 6 | | | |
| 2. Home & Listings | 6 | | | |
| 3. Search | 3 | | | |
| 4. Toy Detail | 6 | | | |
| 5. User Profile | 4 | | | |
| 6. Exchanges | 6 | | | |
| 7. Chat & Messaging | 5 | | | |
| 8. Reviews | 4 | | | |
| 9. Referrals | 6 | | | |
| 10. Premium Pass | 6 | | | |
| 11. Paystack | 7 | | | |
| 12. Email | 4 | | | |
| 13. Edge Cases | 5 | | | |
| **Total** | **68** | | | |

---

## Launch Decision

- [ ] All P0 tests pass → Proceed to launch
- [ ] P0 failures identified → Block launch, fix and re-test
- [ ] P1/P2 failures exist → Evaluate if launch-blocking

**Launch approved by**: _________________ **Date**: _________
