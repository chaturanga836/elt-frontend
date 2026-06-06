'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type PipeModalContextValue = {
  active: boolean;
  lock: () => void;
  unlock: () => void;
};

const PipeModalContext = createContext<PipeModalContextValue>({
  active: false,
  lock: () => {},
  unlock: () => {},
});

export function PipeModalProvider({
  segmentActive,
  children,
}: {
  segmentActive: boolean;
  children: ReactNode;
}) {
  const [lockCount, setLockCount] = useState(0);

  const lock = useCallback(() => {
    setLockCount((n) => n + 1);
  }, []);

  const unlock = useCallback(() => {
    setLockCount((n) => Math.max(0, n - 1));
  }, []);

  const value = useMemo(
    () => ({
      active: segmentActive || lockCount > 0,
      lock,
      unlock,
    }),
    [segmentActive, lockCount, lock, unlock],
  );

  return <PipeModalContext.Provider value={value}>{children}</PipeModalContext.Provider>;
}

export function usePipeModalActive() {
  return useContext(PipeModalContext).active;
}

/** Call from intercept modal pages so the pipeline canvas fully suspends keyboard handling. */
export function usePipeModalLock() {
  const { lock, unlock } = useContext(PipeModalContext);

  return { lock, unlock };
}
