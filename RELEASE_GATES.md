# ToyX Release Gates

> A release is NOT considered production-ready simply because `npm run qa` passes.
> Before any merge from `release-candidate-1` into `main`, the following critical
> business journeys must be validated.

## P0 Business Critical Journeys

### Authentication
- [ ] New account registration
- [ ] Login
- [ ] Logout
- [ ] Google OAuth
- [ ] Facebook OAuth

### Toy Exchange Flow
- [ ] Create toy listing
- [ ] Browse listings
- [ ] Search listings
- [ ] View listing details
- [ ] Submit exchange request
- [ ] Accept exchange request
- [ ] Complete exchange

### Messaging
- [ ] Send message
- [ ] Receive message
- [ ] Conversation history loads

### Payments
- [ ] Subscription purchase
- [ ] Subscription activation
- [ ] Subscription renewal
- [ ] Subscription cancellation

### Referral Program
- [ ] Referral link creation
- [ ] Referral signup attribution
- [ ] Referral qualification
- [ ] Referral reward allocation

### Founding Member Program
- [ ] Founding member registration
- [ ] Welcome email delivery
- [ ] Founding member dashboard updates
- [ ] Member number assignment

## Release Rule

If any P0 journey is not tested, production deployment is blocked.
Passing automated tests alone does not satisfy release requirements.
