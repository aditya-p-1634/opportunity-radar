import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300",
        secondary:
          "border-transparent bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
        warning:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
        danger:
          "border-transparent bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
        outline: "border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
        match:
          "border-transparent bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-700 dark:text-indigo-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
