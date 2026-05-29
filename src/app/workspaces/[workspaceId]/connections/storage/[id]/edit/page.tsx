'use client';

import { useParams } from 'next/navigation';
import DynamicConnectionForm from '@/features/connections/components/DynamicConnectionForm';

export default function EditStorageConnectionPage() {
  const params = useParams();
  const id = Number(params.id);

  return (
    <DynamicConnectionForm
      categoryId={2}
      prototypeId=""
      categoryLabel="Storage"
      connectionId={id}
      backHref="/connections"
    />
  );
}
