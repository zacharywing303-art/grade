import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import { DataNormalizer } from './utils/normalizer';
import { CapiTransmitter } from './utils/transmitter';
import { GuardianLogger } from './utils/guardian';

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

const capi = new CapiTransmitter(
  process.env.META_ACCESS_TOKEN || '',
  process.env.META_PIXEL_ID || ''
);

const guardian = new GuardianLogger(process.env.N8N_WEBHOOK_URL || '');

const worker = new Worker('capi-events', async job => {
  console.log(`🔨 Processing Job ${job.id}: ${job.data.stripe_id}`);
  
  const { raw_user_data, amount_dollars, stripe_id } = job.data;

  // 1. Normalize
  const hashedPayload = DataNormalizer.processUserData(raw_user_data);
  
  // 2. Deduplication ID
  const eventId = `purchase_${stripe_id}`;

  // 3. Transmit
  console.log(`🚀 Sending to Meta CAPI (ID: ${eventId})...`);
  const metaResponse = await capi.sendEvent('Purchase', hashedPayload, { amount: amount_dollars }, eventId);

  // 4. Log
  await guardian.logEvent(
    'Purchase',
    metaResponse.status,
    {
      stripe_id: stripe_id,
      event_id: eventId,
      amount: amount_dollars,
      meta_response: metaResponse,
      hashed_email_snippet: (hashedPayload.em || '').substring(0, 10) + '...'
    }
  );

  return metaResponse;

}, { connection });

console.log("👷 CAPI Worker Started. Listening for jobs...");
