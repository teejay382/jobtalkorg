import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export const LoadingSpinner = ({ size = "md", className, text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-4",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Outer rotating ring with neon glow */}
        <div
          className={cn(
            "rounded-full border-primary/30 border-t-primary animate-spin",
            sizeClasses[size]
          )}
          style={{
            boxShadow: "0 0 20px hsl(var(--primary) / 0.5)",
          }}
        />
        
        {/* Inner pulsing glow */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse"
          style={{
            filter: "blur(8px)",
          }}
        />
      </div>
      
      {text && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};
