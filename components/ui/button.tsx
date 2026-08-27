"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

type BaseProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
};

const variantClasses: Record<NonNullable<BaseProps["variant"]>, string> = {
  primary: "bg-charcoal text-ivory hover:bg-charcoal-soft",
  secondary: "bg-transparent text-charcoal border border-charcoal hover:bg-charcoal hover:text-ivory",
  ghost: "bg-transparent text-charcoal hover:bg-ivory-deep",
};

const sizeClasses: Record<NonNullable<BaseProps["size"]>, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-wide transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none";

// framer-motion redefines these drag/animation event handlers with its own signatures,
// so the native DOM attribute types must be omitted to avoid a signature clash.
type MotionConflictingProps =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration";

type ButtonProps = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, MotionConflictingProps> & { href?: undefined };

type LinkButtonProps = BaseProps & { href: string } & Omit<
    React.ComponentProps<typeof Link>,
    "href" | "className" | MotionConflictingProps
  >;

const MotionLink = motion.create(Link);

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.button
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function LinkButton({ variant = "primary", size = "md", className, children, href, ...props }: LinkButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <MotionLink
      href={href}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </MotionLink>
  );
}
