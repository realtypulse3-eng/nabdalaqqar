import { getCurrentSession } from '@/lib/services/organizations';
import { getLeadsBySource, getClosedDealsByMonth, getPropertyStatusBreakdown } from '@/lib/services/analytics';
import { AnalyticsClient } from './analytics-client';

export default async function AnalyticsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const [leadsBySource, dealsByMonth, propertyStatus] = await Promise.all([
    getLeadsBySource(session.organizationId),
    getClosedDealsByMonth(session.organizationId),
    getPropertyStatusBreakdown(session.organizationId),
  ]);

  return (
    <AnalyticsClient leadsBySource={leadsBySource} dealsByMonth={dealsByMonth} propertyStatus={propertyStatus} />
  );
}
