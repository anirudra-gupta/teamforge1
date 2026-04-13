import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className, showText = true, variant = 'default' }) => {
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Stylized 'T' from the logo image - Fluid and modern */}
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="https://github.com/TeamForge01/teamforge.in/blob/main/team%20forge%20logo%202.jpeg"
          className="w-full h-full"
        >
          {/* Main vertical stroke with curve */}
          <path 
            d="M48 35V75C48 78.3137 50.6863 81 54 81H56C59.3137 81 62 78.3137 62 75V35H48Z" 
            fill="#808040" 
          />
          {/* Horizontal top bar with unique fluid shape */}
          <path 
            d="M25 25C25 21.6863 27.6863 19 31 19H69C72.3137 19 75 21.6863 75 25V31C75 34.3137 72.3137 37 69 37H55C51.6863 37 49 34.3137 49 31V25H25Z" 
            fill="#808040" 
          />
          {/* Subtle highlight/shadow for depth like the original */}
          <path 
            d="M49 19H69C72.3137 19 75 21.6863 75 25V31C75 34.3137 72.3137 37 69 37H55C51.6863 37 49 34.3137 49 31V19Z" 
            fill="#6B6B36" 
            fillOpacity="0.3"
          />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col -gap-1">
          <span className="font-serif text-xl font-bold tracking-tight text-[#1f1b12]">
            TeamForge
          </span>
          <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-[#564338] -mt-1">
            Connect. Create. Launch
          </span>
        </div>
      )}
    </div>
  );
};
