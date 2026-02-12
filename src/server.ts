import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { Queue } from 'bullmq';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Redis Queue Connection
const eventQueue = new Queue('capi-events', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

// Use raw body for Stripe signature verification
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    console.error(`⚠️ Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    
    // Extraction logic similar to Python
    // We treat 'pi' as 'any' for quick access to nested properties in this demo
    const charge = (pi as any).charges?.data?.[0] || {};
    const billing = charge.billing_details || {};

    const jobData = {
      raw_user_data: {
        email: billing.email || pi.receipt_email,
        phone: billing.phone,
        city: billing.address?.city,
        state: billing.address?.state
      },
      amount_dollars: (charge.amount || 0) / 100,
      stripe_id: pi.id
    };

    // Add to Queue (Instant Return)
    await eventQueue.add('process-purchase', jobData, {
      attempts: 3, // Retry logic (Enterprise feature)
      backoff: { type: 'exponential', delay: 2000 }
    });
    
    console.log(`📥 Webhook Enqueued: ${pi.id}`);
  }

  res.json({ received: true });
});

app.listen(4242, () => console.log('🚀 Server running on port 4242'));
