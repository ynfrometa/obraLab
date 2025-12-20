export default function Logo({ ...rest }) {
  return (
    <svg id="logo-yankov" width="140" height="40" viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
      {/* Círculo del logo */}
      <circle cx="20" cy="20" r="20" fill="currentColor" className="ccustom" />
      
      {/* Ícono simple: edificio básico */}
      <rect x="12" y="18" width="16" height="12" fill="#2DF8BB" className="ccompli2" rx="1" />
      <path d="M20 11L12 18L28 18L20 11Z" fill="#2DF8BB" className="ccompli2" />
      
      {/* Texto "Yankov.sl" - muy simple y legible */}
      <text 
        x="48" 
        y="27" 
        fill="currentColor" 
        className="ccustom" 
        fontSize="18" 
        fontWeight="600" 
        fontFamily="Arial, sans-serif"
      >
        Yankov.sl
      </text>
    </svg>
  );
}
