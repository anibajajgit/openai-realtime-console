
import * as React from "react";

const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const Label = React.forwardRef(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-4 text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
