import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}

export default function Card({ children, className = '', highlight = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl p-6 transition-all duration-300 ${
        highlight
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-2'
          : 'bg-white border border-gray-100 shadow-sm hover:shadow-lg'
      } ${className}`}
    >
      {children}
    </div>
  );
}
