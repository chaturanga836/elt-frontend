import { redirect } from 'next/navigation';

type Props = { params: Promise<{ workspaceId: string }> };

export default async function WorkspaceHomePage({ params }: Props) {
  const { workspaceId } = await params;
  redirect(`/projects/${workspaceId}/workflow`);
}
