import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names, resolving conflicts (shadcn convention). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a large number with thousands separators. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
