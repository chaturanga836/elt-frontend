'use client';

import { useParams } from 'next/navigation';
import DynamicConnectionForm from '@/features/connections/components/DynamicConnectionForm';

export default function NewStorageConnectionPage() {
  const params = useParams();
  const proto = String(params.proto);

  return (
    <DynamicConnectionForm
      categoryId={2}
      prototypeId={proto}
      categoryLabel="Storage"
      backHref="/connections/storage"
    />
  );
}
