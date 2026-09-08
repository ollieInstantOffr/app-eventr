import "server-only";
import { env } from "@/lib/env";

/**
 * SMS is optional: the winner message goes by email regardless, and by SMS
 * too when a provider is configured. The interface is deliberately small so
 * a provider can be added without touching the winners code.
 */
export interface SmsProvider {
  send(to: string, body: string): Promise<{ id?: string }>;
}

export const smsEnabled = env.SMS_PROVIDER.length > 0 && env.SMS_API_KEY.length > 0;

/**
 * A generic HTTP provider. `SMS_PROVIDER` is the endpoint; most providers
 * accept a bearer token and a JSON body of this shape, and anything that
 * doesn't can implement SmsProvider instead.
 */
class HttpSmsProvider implements SmsProvider {
  async send(to: string, body: string) {
    const response = await fetch(env.SMS_PROVIDER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SMS_API_KEY}`,
      },
      body: JSON.stringify({ to, from: env.SMS_FROM, message: body }),
    });

    if (!response.ok) {
      throw new Error(`SMS provider returned ${response.status}`);
    }

    const data = (await response.json().catch(() => ({}))) as { id?: string };
    return { id: data.id };
  }
}

const provider: SmsProvider | null = smsEnabled ? new HttpSmsProvider() : null;

export async function sendSms(to: string, body: string): Promise<{ delivered: boolean }> {
  if (!provider) {
    console.info(`[sms] not configured, would have sent to ${to}: ${body}`);
    return { delivered: false };
  }

  await provider.send(to, body);
  return { delivered: true };
}
