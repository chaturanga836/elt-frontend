'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePipeModalLock } from '@/app/workspaces/[workspaceId]/pipe/PipeModalContext';

function blurPipelineFocus() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return;
  if (active.closest('.fullscreen-modal-container')) return;
  if (active.closest('.react-flow')) {
    active.blur();
  }
}

/** Fullscreen overlay shell — avoids Ant Modal focus-trap fighting Monaco Tab/arrows. */
export default function PipelineInterceptShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const { lock, unlock } = usePipeModalLock();

  useLayoutEffect(() => {
    lock();
    blurPipelineFocus();
    return () => {
      unlock();
    };
  }, [lock, unlock]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fullscreen-modal-container"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        aria-hidden
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          cursor: 'default',
          zIndex: 0,
        }}
      />
      <div
        className="fullscreen-modal"
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          background: '#fff',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
