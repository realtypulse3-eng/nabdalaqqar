// Hand-authored types mirroring supabase/schema.sql.
// Regenerate from your live schema for full accuracy:
//   npx supabase gen types typescript --project-id <your-project-ref> > src/lib/supabase/types.ts

export type OrgRole = 'owner' | 'admin' | 'agent' | 'staff';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'nurturing' | 'converted' | 'lost';
export type LeadSource = 'website' | 'referral' | 'campaign' | 'walk_in' | 'portal' | 'whatsapp' | 'other';
export type ClientStatus = 'active' | 'past' | 'prospect';
export type PropertyStatus = 'draft' | 'active' | 'under_offer' | 'sold' | 'rented' | 'off_market';
export type PropertyType = 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'office' | 'retail' | 'land' | 'other';
export type DealStatus = 'open' | 'negotiation' | 'under_contract' | 'closed_won' | 'closed_lost';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type CampaignChannel = 'email' | 'whatsapp' | 'sms' | 'social' | 'ads' | 'other';
export type AgentStatus = 'idle' | 'working' | 'analyzing' | 'waiting' | 'error' | 'disabled';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  language: 'en' | 'ar';
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  owner_id: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  assigned_to: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  source: LeadSource;
  budget_min: number | null;
  budget_max: number | null;
  interest: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  assigned_to: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  tags: string[];
  notes: string | null;
  converted_from_lead_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  organization_id: string;
  listed_by: string | null;
  title: string;
  address: string | null;
  city: string | null;
  price: number | null;
  property_type: PropertyType;
  status: PropertyStatus;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  description: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  organization_id: string;
  property_id: string | null;
  client_id: string | null;
  lead_id: string | null;
  owner_id: string | null;
  title: string;
  value: number;
  status: DealStatus;
  probability: number;
  closing_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assigned_to: string | null;
  related_lead_id: string | null;
  related_deal_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  organization_id: string;
  client_id: string | null;
  lead_id: string | null;
  property_id: string | null;
  agent_id: string | null;
  starts_at: string;
  ends_at: string | null;
  type: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  organization_id: string;
  name: string;
  status: CampaignStatus;
  channel: CampaignChannel;
  budget: number | null;
  spend: number;
  leads_generated: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  organization_id: string | null;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  organization_id: string;
  client_id: string | null;
  lead_id: string | null;
  channel: CampaignChannel;
  subject: string | null;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  organization_id: string;
  sender_type: 'agent_user' | 'contact' | 'ai_agent';
  sender_id: string | null;
  language: string | null;
  body: string;
  translated_body: string | null;
  created_at: string;
}

export interface AiAgent {
  id: string;
  organization_id: string;
  key: string;
  name: string;
  description: string | null;
  status: AgentStatus;
  icon: string | null;
  capabilities: string[];
  config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiAgentRun {
  id: string;
  agent_id: string;
  organization_id: string;
  triggered_by: string | null;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}
