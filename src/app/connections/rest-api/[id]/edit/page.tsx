'use client';

import { useParams } from 'next/navigation';
import RestApiForm from '@/features/connections/components/RestApiForm';

export default function EditRestPage() {
  const params = useParams();
  
  return (
    <div className="p-8">
      <RestApiForm sourceId="rest-api" id={params.id as string} />
    </div>
  );
}