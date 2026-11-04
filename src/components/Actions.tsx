import type { ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router";
import { Icon, type IconName } from "./Icon";
type Tone = "primary" | "secondary" | "quiet" | "danger";
export function ActionButton({
  icon,
  tone,
  loading = false,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  tone?: Tone;
  loading?: boolean;
}) {
  const appearance =
    tone ??
    (className === "button"
      ? "primary"
      : className === "text-link"
        ? "quiet"
        : "secondary");
  return (
    <button
      type={type}
      className={`ui-button ui-button--${appearance} ${className}`}
      aria-busy={loading || undefined}
      {...props}
    >
      <Icon
        name={loading ? "loader" : icon}
        className={loading ? "ui-icon-spin" : undefined}
      />
      <span>{children}</span>
    </button>
  );
}
export function ActionLink({
  icon,
  className = "text-link",
  children,
  ...props
}: LinkProps & { icon: IconName }) {
  return (
    <Link
      className={`${className === "button" ? "ui-button ui-button--primary" : "ui-action-link"} ${className}`}
      {...props}
    >
      <Icon name={icon} />
      <span>{children}</span>
    </Link>
  );
}
