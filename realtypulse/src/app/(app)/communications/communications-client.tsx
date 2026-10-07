'use client';

import { useEffect, useState } from 'react';
import { useActionState } from '@/lib/hooks/use-action-state';
import { useI18n } from '@/lib/i18n/i18n-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input, Label, Select } from '@/components/ui/input';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { sendMessage, createConversation } from '@/lib/actions/communications';
import type { FormActionState } from '@/lib/actions/leads';
import { can } from '@/lib/permissions';
import type { Conversation, Message, Client, Lead, OrgRole } from '@/lib/supabase/types';

const initial: FormActionState = {};

function NewConversationForm({ clients, leads, onDone }: { clients: Client[]; leads: Lead[]; onDone: () => void }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(createConversation, initial);

  if (state.success) onDone();

  return (
    <form onSubmit={(e) => { e.preventDefault(); formAction(new FormData(e.currentTarget)); }} className="space-y-4">
      <div>
        <Label>{t('campaigns.channel')}</Label>
        <Select name="channel" defaultValue="whatsapp">
          {['whatsapp', 'email', 'sms', 'social', 'ads', 'other'].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('contacts.title')}</Label>
          <Select name="client_id" defaultValue="">
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t('leads.title')}</Label>
          <Select name="lead_id" defaultValue="">
            <option value="">—</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label>Subject</Label>
        <Input name="subject" />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={pending}>
          {t('common.create')}
        </Button>
      </div>
    </form>
  );
}

export function CommunicationsClient({
  initialConversations,
  clients,
  leads,
  role,
}: {
  initialConversations: (Conversation & { clients?: { name: string } | null; leads?: { name: string } | null })[];
  clients: Client[];
  leads: Lead[];
  role: OrgRole;
}) {
  const { t } = useI18n();
  const canCreate = can(role, 'create');
  const [conversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(initialConversations[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    fetch(`/api/conversations/${activeId}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []))
      .finally(() => setLoadingMessages(false));
  }, [activeId]);

  async function handleSend() {
    if (!activeId || !draft.trim()) return;
    const fd = new FormData();
    fd.set('conversation_id', activeId);
    fd.set('body', draft);
    await sendMessage(initial, fd);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        conversation_id: activeId,
        organization_id: '',
        sender_type: 'agent_user',
        sender_id: null,
        language: null,
        body: draft,
        translated_body: null,
        created_at: new Date().toISOString(),
      },
    ]);
    setDraft('');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-[-0.02em] text-ink">{t('communications.title')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('communications.subtitle')}</p>
        </div>
        {canCreate && <Button onClick={() => setModalOpen(true)}>+ {t('communications.newConversation')}</Button>}
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          message={t('empty.conversations')}
          action={canCreate ? <Button onClick={() => setModalOpen(true)}>+ {t('communications.newConversation')}</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <Card className="max-h-[560px] overflow-y-auto p-0">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`block w-full border-b border-white/[0.04] px-4 py-3 text-start text-sm last:border-0 ${
                  activeId === c.id ? 'bg-primary/10' : 'hover:bg-surface-2/50'
                }`}
              >
                <p className="font-medium text-ink">{c.clients?.name || c.leads?.name || c.subject || c.channel}</p>
                <p className="text-xs text-ink-faint">{c.channel} · {new Date(c.last_message_at).toLocaleDateString()}</p>
              </button>
            ))}
          </Card>

          <Card className="flex max-h-[560px] flex-col p-0">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {loadingMessages ? (
                <LoadingState />
              ) : messages.length === 0 ? (
                <p className="text-sm text-ink-muted">{t('empty.conversations')}</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[75%] rounded-control px-3 py-2 text-sm ${
                      m.sender_type === 'agent_user' ? 'ms-auto bg-primary/20 text-ink' : 'bg-surface-2 text-ink'
                    }`}
                  >
                    {m.body}
                  </div>
                ))
              )}
            </div>
            {canCreate && (
              <div className="flex gap-2 border-t border-white/[0.06] p-3">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('communications.typeMessage')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend}>{t('communications.send')}</Button>
              </div>
            )}
          </Card>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('communications.newConversation')}>
        <NewConversationForm clients={clients} leads={leads} onDone={() => { setModalOpen(false); location.reload(); }} />
      </Modal>
    </div>
  );
}
