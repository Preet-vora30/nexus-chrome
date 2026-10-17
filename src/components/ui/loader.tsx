import * as React from 'react';

export interface LoaderProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * Lightweight spinner for loading states.
 */
export function Loader({ size = 20, className, ...props }: LoaderProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M12 4a8 8 0 018 8v3a10 10 0 00-20 0v-3A8 8 0 0112 4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animate
          attributeName="transform"
          values="rotate(0 12 12);rotate(360 12 12)"
          dur="1s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
