// Flat sticker art for Parreira.ca episodes. Each icon is an SVG string drawn on a 200x200 canvas; the renderer adds
// the white die-cut outline and the drop shadow, so icons stay simple shapes in the house palette.
const INK = '#18233A';
const RED = '#D7263D';
const YEL = '#FFC93C';
const GRN = '#1F7A4D';
const BLU = '#3E7CB1';
const GRY = '#9AA3AE';
const CRM = '#FFF8EC';

const svg = (body, vb = '0 0 200 200') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const wheel = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="17" fill="${INK}"/><circle cx="${cx}" cy="${cy}" r="7" fill="${GRY}"/>`;
const person = (hat, shirt, skin = '#E9B98F', hair = '#3B2A20') => `
  <rect x="60" y="112" width="80" height="78" rx="30" fill="${shirt}"/>
  <circle cx="100" cy="78" r="32" fill="${skin}"/>
  <path d="M70 66 Q100 30 130 66 L130 60 Q100 20 70 60Z" fill="${hair}"/>
  <path d="M62 66 Q100 18 138 66 L146 70 L54 70Z" fill="${hat}"/>
  <rect x="94" y="30" width="12" height="14" rx="4" fill="${hat}"/>`;

const van = (body, stripe, text, faded = false) => svg(`
  <g opacity="${faded ? 0.75 : 1}">
    <path d="M12 140 V78 Q12 64 26 64 H128 L162 92 Q188 98 188 118 V140 Z" fill="${body}"/>
    <path d="M132 70 L156 92 H132 Z" fill="#CFE3F2"/>
    <rect x="12" y="112" width="176" height="12" fill="${stripe}"/>
    <text x="70" y="102" font-family="Jakarta" font-weight="800" font-size="${text.length > 6 ? 17 : 24}" fill="${stripe === CRM ? INK : CRM}" text-anchor="middle">${text}</text>
    ${wheel(50, 142)}${wheel(152, 142)}
  </g>`);

export const ICONS = {
  van: van(RED, CRM, 'HVAC'),
  vanOld: van('#D8CDB8', '#B9AE98', 'heating', true),
  vanNew: svg(`
    <path d="M12 140 V78 Q12 64 26 64 H128 L162 92 Q188 98 188 118 V140 Z" fill="${INK}"/>
    <path d="M132 70 L156 92 H132 Z" fill="#CFE3F2"/>
    <path d="M12 124 Q90 92 188 112 V126 H12Z" fill="${YEL}"/>
    <text x="68" y="96" font-family="Jakarta" font-weight="800" font-size="19" fill="${CRM}" text-anchor="middle">NORTHWAY</text>
    <text x="68" y="112" font-family="Mono" font-size="10" fill="${YEL}" text-anchor="middle">BOOK ONLINE</text>
    ${wheel(50, 142)}${wheel(152, 142)}`),
  laundromat: svg(`
    <rect x="40" y="24" width="120" height="156" rx="14" fill="${CRM}" stroke="${INK}" stroke-width="6"/>
    <rect x="40" y="24" width="120" height="34" rx="14" fill="${BLU}"/>
    <circle cx="62" cy="41" r="6" fill="${YEL}"/><circle cx="82" cy="41" r="6" fill="${CRM}"/>
    <circle cx="100" cy="116" r="44" fill="${INK}"/><circle cx="100" cy="116" r="32" fill="#8EC5E8"/>
    <path d="M70 122 Q85 108 100 122 T130 122 V138 H70Z" fill="${BLU}"/>`),
  printer: svg(`
    <rect x="58" y="22" width="84" height="56" fill="${CRM}" stroke="${INK}" stroke-width="5"/>
    <rect x="26" y="70" width="148" height="70" rx="14" fill="${GRY}"/>
    <circle cx="150" cy="92" r="6" fill="${GRN}"/>
    <rect x="54" y="120" width="92" height="62" fill="${CRM}" stroke="${INK}" stroke-width="5"/>
    <rect x="66" y="136" width="68" height="6" fill="${RED}"/><rect x="66" y="152" width="50" height="6" fill="${INK}"/>`),
  drivingSchool: svg(`
    <rect x="70" y="40" width="60" height="22" rx="4" fill="${YEL}"/><text x="100" y="57" font-family="Jakarta" font-weight="800" font-size="13" fill="${INK}" text-anchor="middle">DRIVING</text>
    <path d="M20 140 V110 Q20 98 32 96 L58 66 H142 L168 96 Q180 98 180 110 V140Z" fill="${BLU}"/>
    <path d="M66 74 H134 L154 96 H46Z" fill="#CFE3F2"/>
    <rect x="86" y="112" width="28" height="22" rx="3" fill="${CRM}"/><text x="100" y="130" font-family="Jakarta" font-weight="800" font-size="18" fill="${RED}" text-anchor="middle">L</text>
    ${wheel(56, 142)}${wheel(144, 142)}`),
  furnace: svg(`
    <rect x="44" y="14" width="112" height="172" rx="10" fill="#C9CED6" stroke="${INK}" stroke-width="5"/>
    ${[36, 50, 64].map((y) => `<rect x="62" y="${y}" width="76" height="6" rx="3" fill="${GRY}"/>`).join('')}
    <rect x="66" y="96" width="68" height="56" rx="8" fill="${INK}"/>
    <path d="M100 144 Q78 128 92 110 Q96 124 104 116 Q100 102 112 98 Q124 124 100 144Z" fill="#FF8A3D"/>
    <rect x="62" y="164" width="76" height="8" rx="4" fill="${GRY}"/>`),
  forSale: svg(`
    <rect x="34" y="20" width="10" height="170" fill="#7A5230"/>
    <rect x="34" y="40" width="132" height="10" fill="#7A5230"/>
    <rect x="58" y="56" width="104" height="78" rx="6" fill="${RED}" stroke="${CRM}" stroke-width="5"/>
    <text x="110" y="90" font-family="Jakarta" font-weight="800" font-size="22" fill="${CRM}" text-anchor="middle">FOR</text>
    <text x="110" y="118" font-family="Jakarta" font-weight="800" font-size="22" fill="${CRM}" text-anchor="middle">SALE</text>`),
  chair: svg(`
    <rect x="56" y="16" width="88" height="86" rx="20" fill="${INK}"/>
    <rect x="48" y="104" width="104" height="26" rx="12" fill="#2E3B55"/>
    <rect x="94" y="130" width="12" height="34" fill="${GRY}"/>
    <path d="M52 176 L100 160 L148 176" stroke="${GRY}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="52" cy="180" r="8" fill="${INK}"/><circle cx="148" cy="180" r="8" fill="${INK}"/><circle cx="100" cy="182" r="8" fill="${INK}"/>`),
  notebook: svg(`
    <rect x="44" y="18" width="116" height="166" rx="10" fill="${CRM}" stroke="${INK}" stroke-width="5"/>
    ${[44, 68, 92, 116, 140].map((y) => `<rect x="62" y="${y}" width="80" height="4" fill="#B8C7D9"/>`).join('')}
    ${[36, 64, 92, 120, 148].map((y) => `<circle cx="44" cy="${y}" r="7" fill="${GRY}"/>`).join('')}
    <path d="M62 62 L72 72 L92 50" stroke="${GRN}" stroke-width="7" fill="none" stroke-linecap="round"/>`),
  handshake: svg(`
    <path d="M6 96 L60 72 L100 96 L60 128 Z" fill="${BLU}"/>
    <path d="M194 96 L140 72 L100 96 L140 128 Z" fill="${INK}"/>
    <path d="M60 86 Q100 60 140 86 L130 120 Q100 136 70 120 Z" fill="#E9B98F"/>
    <path d="M78 98 Q100 86 122 98" stroke="#C99467" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M80 110 Q100 100 120 110" stroke="#C99467" stroke-width="5" fill="none" stroke-linecap="round"/>`),
  calendar: svg(`
    <rect x="20" y="30" width="160" height="150" rx="14" fill="${CRM}" stroke="${INK}" stroke-width="5"/>
    <rect x="20" y="30" width="160" height="36" rx="14" fill="${RED}"/>
    <rect x="52" y="18" width="10" height="28" rx="4" fill="${INK}"/><rect x="138" y="18" width="10" height="28" rx="4" fill="${INK}"/>
    ${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${36 + c * 34}" y="${80 + r * 32}" width="24" height="22" rx="4" fill="#E4E8EE"/>`).join('')).join('')}`),
  check: svg(`<circle cx="100" cy="100" r="80" fill="${GRN}"/><path d="M58 102 L88 132 L144 72" stroke="${CRM}" stroke-width="20" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  veteran: svg(person(YEL, BLU, '#E2AE84', '#BFBFBF') + `<path d="M76 92 Q100 120 124 92 Q122 112 100 116 Q78 112 76 92Z" fill="#BFBFBF"/>`),
  apprentice: svg(person('#FF8A3D', GRN)),
  apprentice2: svg(person('#FF8A3D', RED, '#8D5B3E', '#1E1410')),
  apprentice3: svg(person('#FF8A3D', INK, '#F1C9A5', '#7A4A22')),
  gradCap: svg(`
    <path d="M10 82 L100 44 L190 82 L100 120 Z" fill="${INK}"/>
    <path d="M52 100 V138 Q100 166 148 138 V100 L100 120Z" fill="#2E3B55"/>
    <path d="M170 90 V140" stroke="${YEL}" stroke-width="6"/><circle cx="170" cy="146" r="9" fill="${YEL}"/>`),
  phone: svg(`
    <rect x="56" y="10" width="88" height="180" rx="18" fill="${INK}"/>
    <rect x="64" y="28" width="72" height="140" rx="6" fill="${CRM}"/>
    <rect x="72" y="40" width="56" height="10" rx="3" fill="${RED}"/>
    ${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${74 + c * 18}" y="${60 + r * 18}" width="14" height="14" rx="3" fill="${r === 1 && c === 1 ? GRN : '#E4E8EE'}"/>`).join('')).join('')}
    <rect x="72" y="126" width="56" height="26" rx="8" fill="${GRN}"/><text x="100" y="144" font-family="Jakarta" font-weight="800" font-size="11" fill="${CRM}" text-anchor="middle">BOOK</text>`),
  star: svg(`<path d="M100 14 L124 72 L188 76 L138 116 L154 180 L100 144 L46 180 L62 116 L12 76 L76 72Z" fill="${YEL}" stroke="#E0A800" stroke-width="5" stroke-linejoin="round"/>`),
  badgeOld: svg(`
    <circle cx="100" cy="100" r="88" fill="#D8CDB8" stroke="#8C7F67" stroke-width="6"/>
    <circle cx="100" cy="100" r="66" fill="none" stroke="#8C7F67" stroke-width="3" stroke-dasharray="6 6"/>
    <text x="100" y="92" font-family="Newsreader" font-style="italic" font-size="26" fill="#5B5040" text-anchor="middle">Northway</text>
    <text x="100" y="116" font-family="Mono" font-size="11" fill="#5B5040" text-anchor="middle">HEATING &amp; COOLING</text>
    <text x="100" y="138" font-family="Mono" font-size="11" fill="#5B5040" text-anchor="middle">EST. 1995</text>`),
  helpWanted: svg(`
    <path d="M100 10 L100 40" stroke="${INK}" stroke-width="5"/><circle cx="100" cy="12" r="6" fill="${INK}"/>
    <path d="M30 40 H170 V150 H30Z" fill="${YEL}" stroke="${INK}" stroke-width="6"/>
    <text x="100" y="86" font-family="Jakarta" font-weight="800" font-size="28" fill="${INK}" text-anchor="middle">HELP</text>
    <text x="100" y="122" font-family="Jakarta" font-weight="800" font-size="28" fill="${INK}" text-anchor="middle">WANTED</text>`),
  pointer: svg(`<path d="M60 20 L60 150 L92 120 L116 176 L138 166 L114 112 L158 112 Z" fill="${CRM}" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>`),
  arrow: svg(`<path d="M14 110 Q90 60 160 96" stroke="${INK}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M134 66 L170 100 L126 118" stroke="${INK}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`, '0 0 200 160'),
};
