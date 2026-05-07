import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, helperText, error, leftIcon, rightIcon, className, id, ...props },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-(--color-neutral-700)"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-(--color-danger)">*</span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-(--color-neutral-400)">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-500 placeholder-(--color-neutral-400) transition outline-none",
              "focus:ring-2 focus:border-(--color-green-500) focus:ring-(--color-green-200)",
              error
                ? "border-(--color-danger) focus:border-(--color-danger) focus:ring-red-200"
                : "border-(--color-neutral-300)",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute inset-y-0 right-3 flex items-center text-(--color-neutral-400)">
              {rightIcon}
            </span>
          )}
        </div>
        {(helperText || error) && (
          <p
            className={cn(
              "mt-1 text-xs",
              error
                ? "text-(--color-danger)"
                : "text-(--color-neutral-500)"
            )}
          >
            {error ?? helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
