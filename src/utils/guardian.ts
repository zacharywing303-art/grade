import axios from 'axios';

export class GuardianLogger {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  public async logEvent(eventType: string, status: string, details: any) {
    if (!this.webhookUrl) {
      console.warn(`⚠️ Guardian Warning: No n8n URL.`);
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      status: status,
      details: details
    };

    try {
      await axios.post(this.webhookUrl, payload, { timeout: 5000 });
      console.log(`🛡️ Guardian Log Sent: ${status}`);
    } catch (error: any) {
      console.error(`⚠️ Guardian Connection Failed: ${error.message}`);
    }
  }
}
