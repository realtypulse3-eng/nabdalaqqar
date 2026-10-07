import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface IntegrationsStatus {
  whatsapp: {
    connected: boolean;
    phoneNumberId: string | null;
    tokenMasked: string | null;
    connectedAt: string | null;
  };
  email: {
    connected: boolean;
    provider: string | null;
    fromAddress: string | null;
    keyMasked: string | null;
    connectedAt: string | null;
  };
}

function mask(secret: string | null): string | null {
  if (!secret) return null;
  if (secret.length <= 4) return '••••';
  return `••••${secret.slice(-4)}`;
}

/**
 * Safe for the client: returns only booleans, non-secret fields, and a
 * masked last-4 of each secret — never the raw token/key itself. Use
 * getRawIntegrations() instead from server-only sending code.
 */
export async function getIntegrationsStatus(organizationId: string): Promise<IntegrationsStatus> {
  const supabase = createClient();
  const { data } = await supabase.from('integrations').select('*').eq('organization_id', organizationId).maybeSingle();

  return {
    whatsapp: {
      connected: !!(data?.whatsapp_phone_number_id && data?.whatsapp_access_token),
      phoneNumberId: data?.whatsapp_phone_number_id ?? null,
      tokenMasked: mask(data?.whatsapp_access_token ?? null),
      connectedAt: data?.whatsapp_connected_at ?? null,
    },
    email: {
      connected: !!data?.email_api_key,
      provider: data?.email_provider ?? 'resend',
      fromAddress: data?.email_from_address ?? null,
      keyMasked: mask(data?.email_api_key ?? null),
      connectedAt: data?.email_connected_at ?? null,
    },
  };
}

/**
 * Raw credentials for actually sending messages/emails. Server-only.
 * Falls back to env vars if the org hasn't connected its own, so existing
 * env-var-based deployments keep working unchanged.
 */
export async function getRawIntegrations(organizationId: string) {
  const supabase = createClient();
  const { data } = await supabase.from('integrations').select('*').eq('organization_id', organizationId).maybeSingle();

  return {
    whatsappPhoneNumberId: data?.whatsapp_phone_number_id ?? process.env.WHATSAPP_PHONE_NUMBER_ID ?? null,
    whatsappAccessToken: data?.whatsapp_access_token ?? process.env.WHATSAPP_BUSINESS_TOKEN ?? null,
    emailProvider: data?.email_provider ?? 'resend',
    emailApiKey: data?.email_api_key ?? process.env.RESEND_API_KEY ?? null,
    emailFromAddress: data?.email_from_address ?? null,
  };
}
