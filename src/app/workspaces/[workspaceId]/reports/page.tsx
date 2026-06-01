'use client';

import ReportDefinitionsList from '@/features/reports/components/ReportDefinitionsList';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

export default function ReportsPage() {
  const workspaceId = useWorkspaceId();
  return <ReportDefinitionsList workspaceId={workspaceId} />;
}
