import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-paper-border rounded-xl bg-paper/50 my-6">
      <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-600 flex items-center justify-center mb-4">
        <Icon size={24} />
      </div>
      <h3 className="editorial-header text-xl font-medium text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink-light max-w-md mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-sm font-medium transition shadow-paper-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
