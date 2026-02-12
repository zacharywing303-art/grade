import crypto from 'crypto';

export class DataNormalizer {
  private static hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private static cleanString(value: any): string | null {
    if (!value) return null;
    return String(value).trim().toLowerCase();
  }

  private static cleanPhone(value: any): string | null {
    if (!value) return null;
    // Remove all non-numeric chars
    let phone = String(value).replace(/[^0-9]/g, '');
    // Remove leading zeros
    phone = phone.replace(/^0+/, '');
    return phone;
  }

  public static processUserData(rawData: any) {
    const normalized: Record<string, string> = {};

    const email = this.cleanString(rawData.email);
    if (email) normalized.em = this.hashValue(email);

    const phone = this.cleanPhone(rawData.phone);
    if (phone) normalized.ph = this.hashValue(phone);

    const city = this.cleanString(rawData.city);
    if (city) normalized.ct = this.hashValue(city);

    const state = this.cleanString(rawData.state);
    if (state) normalized.st = this.hashValue(state);

    return normalized;
  }
}
