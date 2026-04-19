import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50 relative",
  {
    variants: {
      variant: {
        /* Solid white — use for the single hero CTA only */
        default:
          "rounded-full bg-white text-black hover:bg-white/90 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)]",
        /* Liquid glass droplet — pill, magnetic hover glow */
        droplet: "droplet text-white",
        /* Solid-ish glass droplet for the primary action inside glass surfaces */
        dropletSolid: "droplet droplet-solid text-white font-semibold",
        glass: "rounded-xl glass glass-hover text-white",
        ghost:
          "rounded-full hover:bg-white/5 text-white/80 hover:text-white",
        outline:
          "rounded-full border border-white/15 bg-transparent hover:bg-white/5 text-white",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "droplet", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
