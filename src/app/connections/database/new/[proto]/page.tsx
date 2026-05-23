'use client';

import { useParams } from 'next/navigation';
import DynamicConnectionForm from '@/features/connections/components/DynamicConnectionForm';

export default function NewDatabaseConnectionPage() {
  const params = useParams();
  const proto = String(params.proto);

  return (
    <DynamicConnectionForm
      categoryId={3}
      prototypeId={proto}
      categoryLabel="Database"
      backHref="/connections/database"
    />
  );
}
