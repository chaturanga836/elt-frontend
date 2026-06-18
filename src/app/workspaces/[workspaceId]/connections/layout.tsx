// src/app/connections/layout.tsx
import React from 'react';

export default function ConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="bg-background min-h-screen">
      {/* You can add a specific Connection header here later */}
      {children}
    </section>
  );
}