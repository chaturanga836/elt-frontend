'use client';

import ReportDefinitionForm from '@/features/reports/components/ReportDefinitionForm';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useParams } from 'next/navigation';

export default function EditReportPage() {
  const workspaceId = useWorkspaceId();
  const params = useParams();
  const raw = params?.id;
  const definitionId = typeof raw === 'string' ? Number(raw) : Number(raw?.[0]);

  return <ReportDefinitionForm workspaceId={workspaceId} definitionId={definitionId} />;
}
