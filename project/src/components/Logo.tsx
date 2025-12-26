import { Activity } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 28, text: 'text-2xl' },
    lg: { icon: 36, text: 'text-3xl' },
  };

  return (
    <div className="flex items-center gap-2">
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-2 rounded-lg">
        <Activity size={sizes[size].icon} className="text-white" strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={`${sizes[size].text} font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent dark:from-teal-400 dark:to-teal-500`}>
          CurelyTix
        </span>
      )}
    </div>
  );
}
