// [SOLID: SRP & OCP] CTA Button with Circular Progress Indicator for Processing States
import React from "react";
import { Loader2, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CTAButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
}

export function CTAButton({
  isLoading = false,
  loadingText,
  icon: IconLeft,
  iconRight: IconRight,
  disabled,
  className,
  children,
  ...props
}: CTAButtonProps) {
  return (
    <Button
      disabled={disabled || isLoading}
      className={cn(
        "relative gap-2 font-semibold transition-all select-none",
        isLoading && "cursor-wait opacity-90",
        className
      )}
      {...props}
    >
      {/* Circular Progress Indicator inside CTA button during processing */}
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {IconLeft && <IconLeft className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {IconRight && <IconRight className="w-4 h-4 shrink-0" />}
        </>
      )}
    </Button>
  );
}
