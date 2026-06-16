import React from "react";
import { cn } from "../utils/cn";

const variantClass = {
  primary: "bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] shadow-sm hover:brightness-105",
  secondary: "border border-[var(--record-border)] bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]",
  ghost: "bg-transparent text-[var(--text-main)] hover:bg-[var(--bg-hover)]",
  danger: "bg-[rgb(var(--destructive))] text-white hover:brightness-105",
  outline: "border border-[var(--record-border)] bg-transparent text-[var(--text-main)] hover:border-[var(--record-border-strong)] hover:bg-[var(--bg-hover)]",
  link: "h-auto rounded-none bg-transparent p-0 text-[var(--accent-strong)] underline-offset-4 hover:underline",
};

const sizeClass = {
  sm: "min-h-8 px-3 text-xs",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

const Button = ({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled = false,
  icon = false,
  className = "",
  children,
  ...props
}) => {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:pointer-events-none disabled:opacity-50",
    sizeClass[size],
    variantClass[variant],
    icon && "aspect-square px-0",
    loading && "cursor-wait opacity-80",
    className
  );

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {children}
    </button>
  );
};

export default Button;
