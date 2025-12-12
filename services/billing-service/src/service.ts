import Stripe from 'stripe';
import { BillingRepository } from './repository';
import { Plan, Subscription, SubscriptionStatus } from '@splits-network/shared-types';
import { Logger } from '@splits-network/shared-logging';

export class BillingService {
    private stripe: Stripe;

    constructor(
        private repository: BillingRepository,
        stripeSecretKey: string,
        private logger: Logger
    ) {
        this.stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2025-11-17.clover',
        });
    }

    // Plan methods
    async getPlanById(id: string): Promise<Plan> {
        const plan = await this.repository.findPlanById(id);
        if (!plan) {
            throw new Error(`Plan ${id} not found`);
        }
        return plan;
    }

    async getAllPlans(): Promise<Plan[]> {
        return await this.repository.findAllPlans();
    }

    async createPlan(
        name: string,
        priceMonthly: number,
        stripePriceId?: string,
        features: Record<string, any> = {}
    ): Promise<Plan> {
        return await this.repository.createPlan({
            name,
            price_monthly: priceMonthly,
            stripe_price_id: stripePriceId,
            features,
        });
    }

    // Subscription methods
    async getSubscriptionByRecruiterId(recruiterId: string): Promise<Subscription | null> {
        return await this.repository.findSubscriptionByRecruiterId(recruiterId);
    }

    async isRecruiterSubscriptionActive(recruiterId: string): Promise<boolean> {
        const subscription = await this.getSubscriptionByRecruiterId(recruiterId);
        return subscription?.status === 'active' || subscription?.status === 'trialing';
    }

    async createSubscription(
        recruiterId: string,
        planId: string,
        stripeCustomerId?: string
    ): Promise<Subscription> {
        const plan = await this.getPlanById(planId);

        let stripeSubscriptionId: string | undefined;

        // Create Stripe subscription if customer ID and price ID provided
        if (stripeCustomerId && plan.stripe_price_id) {
            try {
                const stripeSubscription = await this.stripe.subscriptions.create({
                    customer: stripeCustomerId,
                    items: [{ price: plan.stripe_price_id }],
                    payment_behavior: 'default_incomplete',
                    expand: ['latest_invoice.payment_intent'],
                });

                stripeSubscriptionId = stripeSubscription.id;

                return await this.repository.createSubscription({
                    recruiter_id: recruiterId,
                    plan_id: planId,
                    stripe_subscription_id: stripeSubscriptionId,
                    status: stripeSubscription.status as SubscriptionStatus,
                    current_period_start: new Date((stripeSubscription as any).current_period_start * 1000),
                    current_period_end: new Date((stripeSubscription as any).current_period_end * 1000),
                    cancel_at: stripeSubscription.cancel_at
                        ? new Date(stripeSubscription.cancel_at * 1000)
                        : undefined,
                });
            } catch (error) {
                this.logger.error({ err: error }, 'Failed to create Stripe subscription');
                throw error;
            }
        }

        // Create local subscription without Stripe (for testing/manual plans)
        return await this.repository.createSubscription({
            recruiter_id: recruiterId,
            plan_id: planId,
            status: 'trialing',
        });
    }

    async handleStripeWebhook(event: Stripe.Event): Promise<void> {
        this.logger.info({ type: event.type }, 'Processing Stripe webhook');

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            default:
                this.logger.debug({ type: event.type }, 'Unhandled webhook event type');
        }
    }

    private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
        const subscription = await this.repository.findSubscriptionByStripeId(stripeSubscription.id);

        if (!subscription) {
            this.logger.warn(
                { stripe_subscription_id: stripeSubscription.id },
                'Subscription not found for Stripe webhook'
            );
            return;
        }

        await this.repository.updateSubscription(subscription.id, {
            status: stripeSubscription.status as SubscriptionStatus,
            current_period_start: new Date((stripeSubscription as any).current_period_start * 1000),
            current_period_end: new Date((stripeSubscription as any).current_period_end * 1000),
            cancel_at: stripeSubscription.cancel_at
                ? new Date(stripeSubscription.cancel_at * 1000)
                : undefined,
        });

        this.logger.info(
            { subscription_id: subscription.id, status: stripeSubscription.status },
            'Subscription updated from Stripe webhook'
        );
    }

    private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
        const subscription = await this.repository.findSubscriptionByStripeId(stripeSubscription.id);

        if (!subscription) {
            this.logger.warn(
                { stripe_subscription_id: stripeSubscription.id },
                'Subscription not found for deletion webhook'
            );
            return;
        }

        await this.repository.updateSubscription(subscription.id, {
            status: 'canceled',
        });

        this.logger.info({ subscription_id: subscription.id }, 'Subscription canceled from Stripe webhook');
    }

    async cancelSubscription(recruiterId: string): Promise<Subscription> {
        const subscription = await this.getSubscriptionByRecruiterId(recruiterId);
        if (!subscription) {
            throw new Error('No active subscription found');
        }

        // Cancel in Stripe if connected
        if (subscription.stripe_subscription_id) {
            try {
                await this.stripe.subscriptions.cancel(subscription.stripe_subscription_id);
            } catch (error) {
                this.logger.error({ err: error }, 'Failed to cancel Stripe subscription');
                throw error;
            }
        }

        // Update local record
        return await this.repository.updateSubscription(subscription.id, {
            status: 'canceled',
            cancel_at: new Date(),
        });
    }
}
