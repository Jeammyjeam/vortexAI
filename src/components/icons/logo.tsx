import { cn } from "@/lib/utils";

const Logo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("text-primary", className)}
    {...props}
  >
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "hsl(var(--accent))", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path
      d="M16 2L2.75 9.75V25.25L16 30L29.25 25.25V9.75L16 2Z"
      stroke="url(#grad1)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 16L29.25 9.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 16V30"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 16L2.75 9.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Logo;
