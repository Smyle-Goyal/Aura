import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'forest' | 'sage' | 'amber' | 'ink' | 'red' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'forest',
  size = 'md',
  className = ''
}) => {
  const variantStyles = {
    forest: 'bg-forest-50 text-forest-700 border border-forest-200',
    sage: 'bg-sage-50 text-sage-500 border border-sage-200',
    amber: 'bg-amber-50 text-amber-600 border border-amber-200',
    ink: 'bg-paper-muted text-ink-light border border-paper-border',
    red: 'bg-red-50 text-red-700 border border-red-200',
    outline: 'bg-transparent text-ink border border-paper-border',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-md font-medium',
  };

  return (
    <span className={`inline-flex items-center gap-1 leading-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};
