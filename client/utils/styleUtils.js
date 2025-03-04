import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(...inputs));
}
// Utility function for combining class names
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
