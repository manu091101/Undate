import { Module } from '@nestjs/common';

// Billing service abstraction. Adapters: Stripe (SG/global), Razorpay (IN),
// Apple StoreKit 2 (iOS Plus), Google Play Billing (Android Plus).
// Concierge + VIP routed through web checkout to avoid 30% IAP fee.
@Module({})
export class SubscriptionsModule {}
