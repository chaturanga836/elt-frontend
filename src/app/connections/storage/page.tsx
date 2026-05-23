import PrototypePicker from '@/features/connections/components/PrototypePicker';

export default function StorageConnectionsPage() {
  return (
    <PrototypePicker
      categoryId={2}
      title="File & Storage Connections"
      basePath="/connections/storage"
    />
  );
}
