'use client';

import { createContext, useContext } from 'react';

const PipeModalContext = createContext(false);

export function PipeModalProvider({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return <PipeModalContext.Provider value={active}>{children}</PipeModalContext.Provider>;
}

export function usePipeModalActive() {
  return useContext(PipeModalContext);
}
