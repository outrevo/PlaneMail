import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-center sm:gap-0">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-mono">
          {title}
        </h1>
        {description && (
          <p className="text-neutral-600 font-mono">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
