import * as React from "react";
import { cn } from "../../lib/utils";

// --- Card ---
export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-100 shadow-sm", className)} {...props} />
);

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

// --- Button ---
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }>(
  ({ className, variant = "primary", ...props }, ref) => {
    const variants = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/10",
      secondary: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700",
      ghost: "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40",
    };
    return (
      <button
        ref={ref}
        className={cn("inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none", variants[variant], className)}
        {...props}
      />
    );
  }
);

// --- Input & Textarea ---
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn("flex h-10 w-full rounded-lg border border-zinc-800 bg-[#18181b] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 disabled:opacity-50", className)}
      {...props}
    />
  )
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn("flex min-h-[80px] w-full rounded-xl border border-zinc-800 bg-[#18181b] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 disabled:opacity-50 resize-none", className)}
      {...props}
    />
  )
);

// --- Badge ---
export const Badge = ({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'outline' | 'success' }) => {
  const variants = {
    default: "bg-zinc-800 text-zinc-300 border-zinc-700",
    outline: "border-zinc-800 text-zinc-500",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", variants[variant], className)} {...props} />
  );
};

// --- Sidebar ---
export const Sidebar = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <aside className={cn("flex flex-col border-r border-zinc-800 bg-[#09090b] h-screen", className)} {...props}>
    {children}
  </aside>
);

export const SidebarItem = ({ active, icon, label, onClick }: { active?: boolean, icon: React.ReactNode, label: string, onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all duration-150",
      active ? "bg-zinc-800 text-white font-medium shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
    )}
  >
    <span className="text-lg">{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

// --- ScrollArea ---
export const ScrollArea = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("relative overflow-auto custom-scrollbar h-full", className)} {...props}>
    {children}
  </div>
);
