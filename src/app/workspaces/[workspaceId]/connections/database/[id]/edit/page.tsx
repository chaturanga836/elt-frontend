'use client';

import { useParams } from 'next/navigation';
import DynamicConnectionForm from '@/features/connections/components/DynamicConnectionForm';

export default function EditDatabaseConnectionPage() {
  const params = useParams();
  const id = Number(params.id);

  return (
    <DynamicConnectionForm
      categoryId={3}
      prototypeId=""
      categoryLabel="Database"
      connectionId={id}
      backHref="/connections"
    />
  );
}
