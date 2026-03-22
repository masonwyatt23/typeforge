"use client";

interface ScreenShakeProps {
  children: React.ReactNode;
}

export function ScreenShake({ children }: ScreenShakeProps) {
  return (
    <div
      style={{
        transform: "translate(var(--shake-x, 0px), var(--shake-y, 0px))",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
