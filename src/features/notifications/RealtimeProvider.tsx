'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Centrifuge, type Subscription } from 'centrifuge';
import { NotificationService } from '@/services/notification.service';
import { useAuthStore } from '@/store/useAuthStore';
import { parseJwtPayload } from '@/lib/jwt';
import { StudioService } from '@/services/studio.service';

type RealtimeContextValue = {
  connected: boolean;
  centrifuge: Centrifuge | null;
  subscribe: (channel: string, handler: (data: unknown) => void) => void;
  unsubscribe: (channel: string) => void;
  refreshInbox: () => void;
  inboxVersion: number;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return ctx;
}

export function RealtimeProvider({
  children,
  workspaceId,
}: {
  children: React.ReactNode;
  workspaceId: number;
}) {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [connected, setConnected] = useState(false);
  const [inboxVersion, setInboxVersion] = useState(0);
  const centrifugeRef = useRef<Centrifuge | null>(null);
  const subsRef = useRef<Map<string, Subscription>>(new Map());

  const refreshInbox = useCallback(() => {
    setInboxVersion((v) => v + 1);
  }, []);

  const subscribe = useCallback((channel: string, handler: (data: unknown) => void) => {
    const client = centrifugeRef.current;
    if (!client) return;
    let sub = subsRef.current.get(channel);
    if (!sub) {
      sub = client.newSubscription(channel);
      subsRef.current.set(channel, sub);
      sub.subscribe();
    }
    sub.on('publication', (ctx) => handler(ctx.data));
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    const sub = subsRef.current.get(channel);
    if (sub) {
      sub.unsubscribe();
      sub.removeAllListeners();
      subsRef.current.delete(channel);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return undefined;

    let cancelled = false;
    let client: Centrifuge | null = null;

    (async () => {
      try {
        const status = await NotificationService.getStatus(workspaceId);
        if (!status.enabled || cancelled) return;

        const tokenRes = await NotificationService.getRealtimeToken();
        if (cancelled) return;

        client = new Centrifuge(tokenRes.ws_url, { token: tokenRes.token });
        centrifugeRef.current = client;

        client.on('connected', () => {
          if (!cancelled) setConnected(true);
          void (async () => {
            try {
              const account = await StudioService.getAccount();
              const jwtSub = parseJwtPayload(token)?.sub;
              if (jwtSub && account.organization?.id) {
                const userChannel = `org:${account.organization.id}:user:${jwtSub}`;
                const sub = client!.newSubscription(userChannel);
                sub.on('publication', () => refreshInbox());
                sub.subscribe();
                subsRef.current.set(userChannel, sub);
              }
            } catch {
              // ignore inbox subscription errors
            }
          })();
        });
        client.on('disconnected', () => {
          if (!cancelled) setConnected(false);
        });
        client.connect();
      } catch {
        // notifications disabled or not provisioned
      }
    })();

    return () => {
      cancelled = true;
      subsRef.current.forEach((sub) => {
        sub.unsubscribe();
        sub.removeAllListeners();
      });
      subsRef.current.clear();
      client?.disconnect();
      centrifugeRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, token, workspaceId, subscribe, refreshInbox]);

  return (
    <RealtimeContext.Provider
      value={{
        connected,
        centrifuge: centrifugeRef.current,
        subscribe,
        unsubscribe,
        refreshInbox,
        inboxVersion,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}
