import { cn } from "@/lib/utils";
import { forwardRef } from "react";

/* ---------------- Button ---------------- */
type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-[var(--accent)] text-white hover:opacity-90 shadow-sm",
  outline: "border border-[var(--border)] bg-white hover:bg-slate-50 text-slate-700",
  ghost: "hover:bg-slate-100 text-slate-700",
  danger: "bg-[var(--danger)] text-white hover:opacity-90",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  icon: "h-9 w-9",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
>(({ className, variant = "primary", size = "md", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
      buttonVariants[variant],
      buttonSizes[size],
      className
    )}
    {...props}
  />
));
Button.displayName = "Button";

/* ---------------- Card ---------------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-[var(--border)] bg-white shadow-sm", className)}
      {...props}
    />
  );
}

/* ---------------- Input ---------------- */
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-indigo-100",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

/* ---------------- Textarea ---------------- */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-indigo-100",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/* ---------------- Label ---------------- */
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)} {...props} />
  );
}

/* ---------------- Badge ---------------- */
export function Badge({
  className,
  color = "slate",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: string }) {
  const colors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    indigo: "bg-indigo-100 text-indigo-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[color],
        className
      )}
      {...props}
    />
  );
}

/* ---------------- Page Header ---------------- */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
