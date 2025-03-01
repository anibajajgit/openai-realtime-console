
import * as React from "react";
import { cn } from "../../utils/cn";

const buttonVariants = {
  variant: {
    default: "bg-blue-600 text-white shadow-sm shadow-black/5 hover:bg-blue-700",
    destructive: "bg-red-600 text-white shadow-sm shadow-black/5 hover:bg-red-700",
    outline: "border border-gray-300 bg-white shadow-sm shadow-black/5 hover:bg-gray-100",
    secondary: "bg-gray-200 text-gray-900 shadow-sm shadow-black/5 hover:bg-gray-300",
    ghost: "hover:bg-gray-100",
    link: "text-blue-600 underline-offset-4 hover:underline",
  },
  size: {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-lg px-3 text-xs",
    lg: "h-10 rounded-lg px-8",
    icon: "h-9 w-9",
  },
};

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button 
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500/70 disabled:pointer-events-none disabled:opacity-50",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )} 
        ref={ref} 
        {...props} 
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
