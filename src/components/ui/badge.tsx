import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        primary: "bg-primary/12 text-primary",
        success: "bg-success/12 text-success",
        warn: "bg-warn/14 text-warn",
        danger: "bg-destructive/12 text-destructive",
        outline: "border border-border text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function statusBadgeVariant(status: string) {
  const s = status.toLowerCase();
  if (["active", "issued", "paid", "delivered", "verified"].includes(s)) return "success" as const;
  if (["expired", "payment_pending", "in_production", "shipped"].includes(s)) return "warn" as const;
  if (["revoked", "failed", "cancelled", "suspended"].includes(s)) return "danger" as const;
  return "default" as const;
}
