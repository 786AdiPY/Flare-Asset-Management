import type { SVGProps } from "react";

function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      {...props}
    />
  );
}

export function BracketsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M9 6 4 12l5 6" />
      <path d="M15 6l5 6-5 6" />
    </Base>
  );
}

export function BoltIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" />
    </Base>
  );
}

export function RouteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M8.2 6h7.6M7.4 8L11 16M16.6 8 13 16" />
    </Base>
  );
}

export function PulseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    </Base>
  );
}

export function SwapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 8h13m0 0-4-4m4 4-4 4" />
      <path d="M20 16H7m0 0 4-4m-4 4 4 4" />
    </Base>
  );
}

export function LayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 16l9 5 9-5" />
    </Base>
  );
}

export function CpuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </Base>
  );
}
