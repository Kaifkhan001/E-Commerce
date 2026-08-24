import Link from "next/link";
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

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkButtonProps = BaseProps & { href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className">;

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button className={cn(base, variantClasses[variant], sizeClasses[size], className)} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({ variant = "primary", size = "md", className, children, href, ...props }: LinkButtonProps) {
  return (
    <Link href={href} className={cn(base, variantClasses[variant], sizeClasses[size], className)} {...props}>
      {children}
    </Link>
  );
}
