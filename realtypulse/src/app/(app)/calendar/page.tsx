import { getCurrentSession } from '@/lib/services/organizations';
import { listAppointments } from '@/lib/services/appointments';
import { listClients } from '@/lib/services/clients';
import { listProperties } from '@/lib/services/properties';
import { CalendarClient } from './calendar-client';

export default async function CalendarPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const [appointments, clients, properties] = await Promise.all([
    listAppointments(session.organizationId),
    listClients(session.organizationId),
    listProperties(session.organizationId),
  ]);

  return (
    <CalendarClient
      initialAppointments={appointments}
      clients={clients}
      properties={properties}
      role={session.role}
    />
  );
}
