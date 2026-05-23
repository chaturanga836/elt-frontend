import PrototypePicker from '@/features/connections/components/PrototypePicker';

export default function DatabaseConnectionsPage() {
  return (
    <PrototypePicker
      categoryId={3}
      title="Database Connections"
      basePath="/connections/database"
    />
  );
}
