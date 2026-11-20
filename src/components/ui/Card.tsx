import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "", onClick, testID }) => {
  const isClickable = !!onClick;
  return (
    <div
      data-testid={testID}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`bg-white dark:bg-[#161722] rounded-2xl border border-slate-200 dark:border-[#282A3A] p-4 shadow-xs transition-all ${
        isClickable ? "cursor-pointer hover:border-[#00A3A6]/40 active:scale-[0.99]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};
