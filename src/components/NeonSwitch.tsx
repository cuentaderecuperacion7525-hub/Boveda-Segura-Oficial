import React from 'react';
import { themeService, VaultTheme } from '../services/themeService';

export interface NeonSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

export const NeonSwitch: React.FC<NeonSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  id,
  name,
  size = 'md',
  ariaLabel,
}) => {
  const [currentTheme, setCurrentTheme] = React.useState<VaultTheme>(() => themeService.getTheme());

  React.useEffect(() => {
    return themeService.subscribe((theme) => {
      setCurrentTheme(theme);
    });
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {}
    }
    onChange(!checked);
  };

  // Dimensions based on size
  const sizeClasses = {
    sm: {
      track: 'w-10 h-5.5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-[1.125rem]',
    },
    md: {
      track: 'w-12 h-6.5',
      thumb: 'w-5 h-5',
      translate: 'translate-x-[1.375rem]',
    },
    lg: {
      track: 'w-14 h-7.5',
      thumb: 'w-6 h-6',
      translate: 'translate-x-[1.625rem]',
    },
  }[size];

  // Neon glow and background according to active theme
  const getActiveThemeStyle = () => {
    if (!checked) {
      return currentTheme === 'light'
        ? 'bg-slate-200 border-slate-300 text-slate-500'
        : 'bg-slate-800 border-slate-700/80 text-slate-400';
    }

    if (currentTheme === 'light') {
      return 'bg-sky-600 border-sky-500 shadow-[0_0_10px_rgba(2,132,199,0.45)]';
    }

    return 'bg-[#00e5ff] border-cyan-300 shadow-[0_0_14px_rgba(0,229,255,0.75)]';
  };

  return (
    <button
      type="button"
      role="switch"
      id={id}
      name={name}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      className={`relative inline-flex shrink-0 items-center rounded-full p-0.5 border cursor-pointer select-none transition-all duration-250 ease-out focus:outline-none ${sizeClasses.track} ${getActiveThemeStyle()} ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
      }`}
    >
      <span
        className={`pointer-events-none inline-block rounded-full bg-white shadow-md transform ring-0 transition-transform duration-250 ease-out ${sizeClasses.thumb} ${
          checked ? sizeClasses.translate : 'translate-x-0.5'
        }`}
      />
    </button>
  );
};
