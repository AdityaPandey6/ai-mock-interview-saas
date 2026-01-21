import type { ReactNode } from 'react';

interface SectionContainerProps {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}

export default function SectionContainer({
  children,
  className = '',
  dark = false,
}: SectionContainerProps) {
  return (
    <section
      className={`py-16 md:py-24 px-4 sm:px-6 lg:px-8 ${
        dark ? 'bg-gray-900 text-white' : 'bg-white'
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  );
}
