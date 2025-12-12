import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BillingService } from './service';
import { NotFoundError, BadRequestError, UnauthorizedError } from '@splits-network/shared-fastify';
import Stripe from 'stripe';

interface CreatePlanBody {
    name: string;
    price_monthly: number;
    stripe_price_id?: string;
    features?: Record<string, any>;
}

interface CreateSubscriptionBody {
    recruiter_id: string;
    plan_id: string;
    stripe_customer_id?: string;
}

export function registerRoutes(
    app: FastifyInstance,
    service: BillingService,
    stripeWebhookSecret: string
) {
    // Plan routes
    app.get('/plans', async (request: FastifyRequest, reply: FastifyReply) => {
        const plans = await service.getAllPlans();
        return reply.send({ data: plans });
    });

    app.get(
        '/plans/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const plan = await service.getPlanById(request.params.id);
                return reply.send({ data: plan });
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    throw new NotFoundError('Plan', request.params.id);
                }
                throw error;
            }
        }
    );

    app.post('/plans', async (request: FastifyRequest<{ Body: CreatePlanBody }>, reply: FastifyReply) => {
        const { name, price_monthly, stripe_price_id, features } = request.body;

        if (!name || price_monthly === undefined) {
            throw new BadRequestError('name and price_monthly are required');
        }

        const plan = await service.createPlan(name, price_monthly, stripe_price_id, features);
        return reply.status(201).send({ data: plan });
    });

    // Subscription routes
    app.get(
        '/subscriptions/recruiter/:recruiterId',
        async (request: FastifyRequest<{ Params: { recruiterId: string } }>, reply: FastifyReply) => {
            const subscription = await service.getSubscriptionByRecruiterId(request.params.recruiterId);
            if (!subscription) {
                throw new NotFoundError('Subscription for recruiter', request.params.recruiterId);
            }
            return reply.send({ data: subscription });
        }
    );

    app.get(
        '/subscriptions/recruiter/:recruiterId/status',
        async (request: FastifyRequest<{ Params: { recruiterId: string } }>, reply: FastifyReply) => {
            const isActive = await service.isRecruiterSubscriptionActive(request.params.recruiterId);
            return reply.send({ data: { is_active: isActive } });
        }
    );

    app.post(
        '/subscriptions',
        async (request: FastifyRequest<{ Body: CreateSubscriptionBody }>, reply: FastifyReply) => {
            const { recruiter_id, plan_id, stripe_customer_id } = request.body;

            if (!recruiter_id || !plan_id) {
                throw new BadRequestError('recruiter_id and plan_id are required');
            }

            const subscription = await service.createSubscription(
                recruiter_id,
                plan_id,
                stripe_customer_id
            );
            return reply.status(201).send({ data: subscription });
        }
    );

    app.post(
        '/subscriptions/:recruiterId/cancel',
        async (request: FastifyRequest<{ Params: { recruiterId: string } }>, reply: FastifyReply) => {
            const subscription = await service.cancelSubscription(request.params.recruiterId);
            return reply.send({ data: subscription });
        }
    );

    // Stripe webhook
    app.post(
        '/webhooks/stripe',
        {
            config: {
                rawBody: true,
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const signature = request.headers['stripe-signature'];

            if (!signature) {
                throw new UnauthorizedError('Missing stripe-signature header');
            }

            let event: Stripe.Event;

            try {
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
                    apiVersion: '2025-11-17.clover',
                });

                event = stripe.webhooks.constructEvent(
                    (request as any).rawBody as Buffer,
                    signature as string,
                    stripeWebhookSecret
                );
            } catch (err: any) {
                request.log.error('Webhook signature verification failed', err);
                throw new UnauthorizedError('Invalid webhook signature');
            }

            await service.handleStripeWebhook(event);
            return reply.send({ received: true });
        }
    );
}
