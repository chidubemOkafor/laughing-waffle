import Link from "next/link";
import type { Route } from "next";

type BrandLogoProps = {
  href?: Route;
  size?: "sm" | "md";
  className?: string;
  wordmark?: boolean;
};

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10"
};

const wordmarkClasses = {
  sm: "h-6 w-36",
  md: "h-8 w-44"
};

export function BrandLogo({ href = "/", size = "sm", className = "", wordmark = true }: BrandLogoProps) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 font-bold text-ink ${className}`} aria-label="LaughingWaffle">
      <span
        className={`${sizeClasses[size]} overflow-hidden rounded-full border border-cloud bg-transparent shadow-sm`}
        aria-hidden="true"
      >
        <img
          src="/laughingwaffle-logo.png"
          alt=""
          className="h-full w-full object-cover"
        />
      </span>
      {wordmark ? (
        <span className={`${wordmarkClasses[size]} overflow-hidden`} aria-hidden="true">
          <img
            src="/laughingwaffle-wordmark.png"
            alt=""
            className="h-full w-full object-contain object-left"
          />
        </span>
      ) : (
        <span>LaughingWaffle</span>
      )}
    </Link>
  );
}
