// Country flag SVG components
export const flags = {
  US: () => (
    <svg className="w-6 h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="30" fill="#B22234"/>
      <path d="M0 11.538h60M0 15.384h60M0 19.23h60" stroke="#fff" strokeWidth="3.846"/>
      <rect width="60" height="11.538" fill="#3C3B6B"/>
    </svg>
  ),
  GB: () => (
    <svg className="w-6 h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="30" fill="#012169"/>
      <path d="M0 0L60 30M60 0L0 30" stroke="#fff" strokeWidth="6"/>
      <path d="M0 0L60 30M60 0L0 30" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6"/>
    </svg>
  ),
  CA: () => (
    <svg className="w-6 h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="30" fill="#FF0000"/>
      <rect x="20" width="20" height="30" fill="#FFF"/>
      <rect x="40" width="20" height="30" fill="#FF0000"/>
      <path d="M30 5l2.5 8h8.5l-6.5 5 2.5 8-6.5-5-6.5 5 2.5-8-6.5-5h8.5l2.5-8z" fill="#FF0000"/>
    </svg>
  ),
  AU: () => (
    <svg className="w-6 h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="30" fill="#00008B"/>
      <path d="M0 0L20 30M20 0L0 30M60 0L40 30M40 0L60 30" stroke="#FFF" strokeWidth="2"/>
      <path d="M30 8L32 14h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z" fill="#FFD700"/>
    </svg>
  ),
  AE: () => (
    <svg className="w-6 h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="10" fill="#00732F"/>
      <rect y="10" width="60" height="10" fill="#FFF"/>
      <rect y="20" width="60" height="10" fill="#000"/>
      <rect width="12" height="30" fill="#CE1126"/>
    </svg>
  ),
  SG: () => (
    <svg className="w-6 h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="30" fill="#CE1126"/>
      <rect y="15" width="60" height="15" fill="#FFF"/>
      <circle cx="20" cy="10" r="4" fill="#FFF"/>
      <path d="M28 8L30 12h5l-4 3 2 5-5-3-5 3 2-5-4-3h5l2-4z" fill="#FFF"/>
      <path d="M40 8L42 12h5l-4 3 2 5-5-3-5 3 2-5-4-3h5l2-4z" fill="#FFF"/>
    </svg>
  ),
  DE: () => (
    <svg className="w-6 h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="10" fill="#000"/>
      <rect y="10" width="60" height="10" fill="#D00"/>
      <rect y="20" width="60" height="10" fill="#FFCE00"/>
    </svg>
  ),
  FR: () => (
    <svg className="w-6 h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="30" fill="#002395"/>
      <rect x="20" width="20" height="30" fill="#FFF"/>
      <rect x="40" width="20" height="30" fill="#ED2939"/>
    </svg>
  ),
  JP: () => (
    <svg className="w-6 h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="30" fill="#BC002D"/>
      <circle cx="30" cy="15" r="9" fill="#FFF"/>
    </svg>
  ),
  CN: () => (
    <svg className="w-6 h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="30" fill="#DE2910"/>
      <path d="M8 6L10 10h5l-4 3 2 5-5-3-5 3 2-5-4-3h5l2-4z" fill="#FFD700"/>
      <path d="M28 4L29 7h3l-2 2 1 3-2-2-2 2 1-3-2-2h3l1-3z" fill="#FFD700"/>
      <path d="M36 4L37 7h3l-2 2 1 3-2-2-2 2 1-3-2-2h3l1-3z" fill="#FFD700"/>
      <path d="M24 10L25 13h3l-2 2 1 3-2-2-2 2 1-3-2-2h3l1-3z" fill="#FFD700"/>
      <path d="M32 10L33 13h3l-2 2 1 3-2-2-2 2 1-3-2-2h3l1-3z" fill="#FFD700"/>
    </svg>
  ),
  SA: () => (
    <svg className="w-6 h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="30" fill="#006C84"/>
      <path d="M10 10L12 14h5l-4 3 2 5-5-3-5 3 2-5-4-3h5l2-4z" fill="#00AA00"/>
      <path d="M20 8L25 18h3v2h-6v-2h3l-2-4h-3l-1-4z" fill="#FFF"/>
    </svg>
  ),
  NL: () => (
    <svg className="w-6 h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="10" fill="#AE1C28"/>
      <rect y="10" width="60" height="10" fill="#FFF"/>
      <rect y="20" width="60" height="10" fill="#33A1D8"/>
    </svg>
  ),
};

export function CountryFlag({ countryCode }) {
  const FlagComponent = flags[countryCode];
  if (!FlagComponent) {
    return <span>{countryCode}</span>;
  }
  return <FlagComponent />;
}
