import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  level: 'green' | 'amber' | 'red' | 'info';
  text: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  level,
  text,
  size = 'md',
  className = '',
}) => {
  const getStyles = () => {
    switch (level) {
      case 'green':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 className={size === 'lg' ? 'w-6 h-6 text-emerald-600' : 'w-5 h-5 text-emerald-600'} />,
        };
      case 'amber':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300',
          icon: <Clock className={size === 'lg' ? 'w-6 h-6 text-amber-600' : 'w-5 h-5 text-amber-600'} />,
        };
      case 'red':
        return {
          bg: 'bg-rose-50 text-rose-900 border-rose-300',
          icon: <AlertTriangle className={size === 'lg' ? 'w-6 h-6 text-rose-600' : 'w-5 h-5 text-rose-600'} />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-sky-50 text-sky-900 border-sky-300',
          icon: <AlertCircle className={size === 'lg' ? 'w-6 h-6 text-sky-600' : 'w-5 h-5 text-sky-600'} />,
        };
    }
  };

  const style = getStyles();
  const sizeClasses =
    size === 'lg'
      ? 'px-4 py-2 text-lg font-bold rounded-xl gap-2.5'
      : size === 'sm'
      ? 'px-2.5 py-1 text-sm font-semibold rounded-lg gap-1.5'
      : 'px-3 py-1.5 text-base font-semibold rounded-xl gap-2';

  return (
    <span
      className={`inline-flex items-center border shadow-xs ${style.bg} ${sizeClasses} ${className}`}
    >
      {style.icon}
      <span>{text}</span>
    </span>
  );
};
