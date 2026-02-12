const bizSdk = require('facebook-nodejs-business-sdk');

const EventRequest = bizSdk.EventRequest;
const UserData = bizSdk.UserData;
const ServerEvent = bizSdk.ServerEvent;
const CustomData = bizSdk.CustomData;

export class CapiTransmitter {
  private access_token: string;
  private pixel_id: string;

  constructor(access_token: string, pixel_id: string) {
    this.access_token = access_token;
    this.pixel_id = pixel_id;
    bizSdk.FacebookAdsApi.init(access_token);
  }

  public async sendEvent(eventName: string, userDataHash: any, customData: any, eventId: string) {
    if (!this.access_token) return { status: 'skipped', message: 'No Access Token' };

    const userData = (new UserData())
      .setEmails([userDataHash.em])
      .setPhones([userDataHash.ph])
      .setCities([userDataHash.ct])
      .setStates([userDataHash.st]);

    const metaCustomData = (new CustomData())
      .setCurrency('usd')
      .setValue(customData.amount || 0);

    const serverEvent = (new ServerEvent())
      .setEventName(eventName)
      .setEventTime(Math.floor(Date.now() / 1000))
      .setUserData(userData)
      .setCustomData(metaCustomData)
      .setEventId(eventId)
      .setActionSource('website');

    const request = (new EventRequest(this.access_token, this.pixel_id))
      .setEvents([serverEvent]);

    try {
      const response = await request.execute();
      return { status: 'success', events_received: response.events_received };
    } catch (error: any) {
      return { status: 'error', message: error.message || JSON.stringify(error) };
    }
  }
}
