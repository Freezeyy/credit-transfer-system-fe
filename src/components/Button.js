import React from "react";

const VARIANT_CLASS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  success: "btn-success",
  danger: "btn-danger",
  warning: "btn-warning",
  indigo: "btn-indigo",
  outline: "btn-outline",
  "outline-danger": "btn-outline-danger",
  ghost: "btn-ghost",
  link: "btn-link",
};

const SIZE_CLASS = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

/**
 * Standard action button — use for new UI; existing buttons are auto-enhanced via buttons.css.
 */
export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}) {
  const variantCls = VARIANT_CLASS[variant] || VARIANT_CLASS.primary;
  const sizeCls = SIZE_CLASS[size] || "";

  return (
    <button
      type={type}
      className={["btn", "cts-action", variantCls, sizeCls, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
