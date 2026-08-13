/** Original mark — a rounded badge with a checkmark, standing for "verified fix." */
export function Logomark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logomark-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2554d6" />
          <stop offset="1" stopColor="#8b7cf6" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#logomark-gradient)" />
      <path
        d="M13 20.5L17.5 25L27 14"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
