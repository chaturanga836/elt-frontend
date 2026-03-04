// src/app/connections/layout.tsx
import React from 'react';

export default function ConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[#f5f7fa] min-h-screen">
      {/* You can add a specific Connection header here later */}
      {children}
    </section>
  );
}