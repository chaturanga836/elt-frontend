'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Spin, message } from 'antd';
import RestApiForm from '@/features/connections/components/RestApiForm';
import { connectionService } from '@/services/connection.service';
import { useConnectionStore } from '@/store/useConnectionStore';

const TENANT = 'trial_user_001';

export default function EditRestPage() {
  const params = useParams();
  const connectionId = Number(params.id);
  const [loading, setLoading] = useState(true);
  const reset = useConnectionStore((s) => s.reset);
  const loadFromEndpoint = useConnectionStore((s) => s.loadFromEndpoint);
  const setGroupContext = useConnectionStore((s) => s.setGroupContext);

  useEffect(() => {
    if (!connectionId || Number.isNaN(connectionId)) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      reset();
      try {
        const data = await connectionService.getRestConnection(connectionId, TENANT);
        if (cancelled) return;
        if (data.group_id) {
          setGroupContext(data.group_id, data.group_name || null);
        }
        loadFromEndpoint(data);
      } catch {
        if (!cancelled) message.error('Failed to load connection');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      reset();
    };
  }, [connectionId, reset, loadFromEndpoint, setGroupContext]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <RestApiForm />
    </div>
  );
}
