
import * as React from "react";

const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const buttonVariants = (options) => {
  const { variant, size, className } = options || {};
  
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    variant === "default" && "bg-blue-500 text-white shadow-sm shadow-black/5 hover:bg-blue-600",
    variant === "destructive" && "bg-red-500 text-white shadow-sm shadow-black/5 hover:bg-red-600",
    variant === "outline" && "border border-gray-200 bg-white shadow-sm shadow-black/5 hover:bg-gray-100",
    variant === "secondary" && "bg-gray-100 text-gray-900 shadow-sm shadow-black/5 hover:bg-gray-200",
    variant === "ghost" && "hover:bg-gray-100",
    variant === "link" && "text-blue-500 underline-offset-4 hover:underline",
    size === "default" && "h-9 px-4 py-2",
    size === "sm" && "h-8 rounded-lg px-3 text-xs",
    size === "lg" && "h-10 rounded-lg px-8",
    size === "icon" && "h-9 w-9",
    className
  );
};

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        type={type}
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
