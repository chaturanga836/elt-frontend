'use client';

import ReportDefinitionForm from '@/features/reports/components/ReportDefinitionForm';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

export default function NewReportPage() {
  const workspaceId = useWorkspaceId();
  return <ReportDefinitionForm workspaceId={workspaceId} />;
}
