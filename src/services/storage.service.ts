import api from './api';

export type WorkspaceStorageStatus = {
  workspace_id: number;
  status: string;
  mode?: string | null;
  bucket?: string | null;
  prefix?: string | null;
  endpoint_url?: string | null;
  plan?: string | null;
  s3_uri?: string | null;
  provisioned_at?: string | null;
  error?: string | null;
  can_provision?: boolean;
};

export type StorageObjectItem = {
  key: string;
  name: string;
  type: 'file' | 'folder';
  size: string;
  size_bytes?: number;
  modified?: string | null;
};

export type StorageObjectListResponse = {
  items: StorageObjectItem[];
  prefix: string;
};

export async function getWorkspaceStorage(workspaceId: number): Promise<WorkspaceStorageStatus> {
  const { data } = await api.get<WorkspaceStorageStatus>(`/workspaces/${workspaceId}/storage`);
  return data;
}

export async function provisionWorkspaceStorage(
  workspaceId: number,
): Promise<WorkspaceStorageStatus> {
  const { data } = await api.post<WorkspaceStorageStatus>(`/workspaces/${workspaceId}/storage`);
  return data;
}

export async function listStorageObjects(
  workspaceId: number,
  prefix = '',
): Promise<StorageObjectListResponse> {
  const { data } = await api.get<StorageObjectListResponse>(
    `/workspaces/${workspaceId}/storage/objects`,
    { params: { prefix } },
  );
  return data;
}

export async function uploadStorageObject(
  workspaceId: number,
  file: File,
  key?: string,
): Promise<{ key: string; name: string }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<{ key: string; name: string }>(
    `/workspaces/${workspaceId}/storage/objects`,
    form,
    {
      params: key ? { key } : undefined,
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data;
}

export async function deleteStorageObject(workspaceId: number, key: string): Promise<void> {
  await api.delete(`/workspaces/${workspaceId}/storage/objects`, { params: { key } });
}
