
import * as React from "react";

const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const Checkbox = React.forwardRef(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked || false);

    React.useEffect(() => {
      setIsChecked(checked || false);
    }, [checked]);

    const handleChange = (e) => {
      const newChecked = e.target.checked;
      setIsChecked(newChecked);
      if (onCheckedChange) {
        onCheckedChange(newChecked);
      }
    };

    return (
      <div className={cn("relative flex items-center", className)}>
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          className="peer h-4 w-4 shrink-0 rounded border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        {isChecked && (
          <svg
            className="pointer-events-none absolute left-0 top-0 h-4 w-4 stroke-white"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
          </svg>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
