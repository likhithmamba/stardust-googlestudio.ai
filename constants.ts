import { NoteType } from './types';

// Sizes are significantly increased for better readability and interaction.
// All diameters have been scaled up to make notes more functional for content.
export const NOTE_STYLES: Record<NoteType, { size: { diameter: number }; colors: string; glow: string; hasRings?: boolean; hasTail?: boolean; }> = {
  // Cosmic Structures
  [NoteType.Galaxy]:     { size: { diameter: 1200 }, colors: 'bg-transparent border-2 border-indigo-400/30', glow: 'shadow-[0_0_120px_20px_rgba(129,140,248,0.3)]' },
  [NoteType.Nebula]:     { size: { diameter: 1600 }, colors: '', glow: '' },
  
  // Stars
  [NoteType.Sun]:        { size: { diameter: 800 }, colors: 'bg-gradient-radial from-yellow-200 via-orange-500 to-red-600 border-amber-200',       glow: 'shadow-[0_0_150px_40px_rgba(252,211,77,0.7)]' },
  [NoteType.RedGiant]:   { size: { diameter: 750 }, colors: 'bg-gradient-radial from-red-400 via-rose-700 to-red-900 border-red-300',                glow: 'shadow-[0_0_130px_35px_rgba(239,68,68,0.6)]' },
  [NoteType.WhiteDwarf]: { size: { diameter: 150 }, colors: 'bg-gradient-radial from-white via-sky-200 to-blue-400 border-white',                   glow: 'shadow-[0_0_80px_20px_rgba(255,255,255,1)]' },
  [NoteType.Pulsar]:     { size: { diameter: 120 }, colors: 'bg-gradient-radial from-white to-blue-300 border-sky-200',                           glow: 'shadow-[0_0_60px_15px_rgba(191,219,254,1)]' },

  // Gas Giants
  [NoteType.Jupiter]:    { size: { diameter: 700 }, colors: 'bg-gradient-radial from-orange-200 via-amber-500 to-stone-400 border-orange-400',       glow: 'shadow-[0_0_100px_25px_rgba(217,119,6,0.5)]' },
  [NoteType.Saturn]:     { size: { diameter: 600 }, colors: 'bg-gradient-radial from-yellow-100 via-amber-200 to-orange-300 border-amber-300',  glow: 'shadow-[0_0_80px_20px_rgba(245,158,11,0.5)]', hasRings: true },

  // Ice Giants
  [NoteType.Neptune]:    { size: { diameter: 480 }, colors: 'bg-gradient-radial from-blue-400 to-indigo-800 border-blue-200',                    glow: 'shadow-[0_0_70px_15px_rgba(99,102,241,0.5)]' },
  [NoteType.Uranus]:     { size: { diameter: 470 }, colors: 'bg-gradient-radial from-cyan-100 to-teal-500 border-cyan-100',                      glow: 'shadow-[0_0_65px_13px_rgba(20,184,166,0.5)]' },

  // Terrestrial Planets
  [NoteType.Earth]:      { size: { diameter: 400 }, colors: 'bg-gradient-radial from-sky-300 via-emerald-500 to-blue-700 border-sky-300',           glow: 'shadow-[0_0_60px_12px_rgba(56,189,248,0.6)]' },
  [NoteType.Venus]:      { size: { diameter: 390 }, colors: 'bg-gradient-radial from-yellow-50 via-orange-100 to-amber-300 border-yellow-200', glow: 'shadow-[0_0_55px_11px_rgba(234,179,8,0.5)]' },
  [NoteType.Mars]:       { size: { diameter: 340 }, colors: 'bg-gradient-radial from-orange-400 via-red-600 to-rose-900 border-red-300',           glow: 'shadow-[0_0_50px_10px_rgba(239,68,68,0.6)]' },
  [NoteType.Mercury]:    { size: { diameter: 300 }, colors: 'bg-gradient-radial from-slate-300 via-gray-500 to-slate-800 border-gray-300',       glow: 'shadow-[0_0_45px_9px_rgba(156,163,175,0.5)]' },
  
  // Dwarf Planets
  [NoteType.Pluto]:      { size: { diameter: 260 }, colors: 'bg-gradient-radial from-slate-100 via-sky-200 to-slate-400 border-sky-100',         glow: 'shadow-[0_0_30px_6px_rgba(164,206,238,0.5)]' },
  [NoteType.Ceres]:      { size: { diameter: 230 }, colors: 'bg-gradient-radial from-stone-400 via-stone-600 to-stone-800 border-stone-300',        glow: 'shadow-[0_0_25px_5px_rgba(120,113,108,0.5)]' },
  
  // Other
  [NoteType.Moon]:       { size: { diameter: 220 }, colors: 'bg-gradient-radial from-slate-200 to-slate-500 border-slate-200',                    glow: 'shadow-[0_0_35px_7px_rgba(100,116,139,0.5)]' },
  [NoteType.Asteroid]:   { size: { diameter: 180 }, colors: 'bg-gradient-radial from-stone-500 via-stone-700 to-stone-900 border-stone-400',        glow: 'shadow-[0_0_15px_3px_rgba(120,113,108,0.5)]' },
  [NoteType.Comet]:      { size: { diameter: 180 }, colors: 'bg-gradient-radial from-cyan-200 to-blue-400 border-cyan-100',                        glow: 'shadow-[0_0_35px_7px_rgba(34,211,238,0.5)]', hasTail: true },
};

export const CELESTIAL_DESCRIPTIONS: Record<NoteType, string> = {
  // Cosmic Structures
  [NoteType.Galaxy]: "A vast system of stars, stellar remnants, interstellar gas, dust, and dark matter bound together by gravity.",
  [NoteType.Nebula]: "A diffuse cloud of interstellar dust and gas. Drag other celestial bodies into a nebula to form a gravitationally-bound cluster.",

  // Stars
  [NoteType.Sun]: "The star at the center of our solar system, providing light and heat.",
  [NoteType.RedGiant]: "A luminous giant star of low or intermediate mass in a late phase of stellar evolution.",
  [NoteType.WhiteDwarf]: "The hot, dense remnant of a star's core after it has exhausted its nuclear fuel.",
  [NoteType.Pulsar]: "A highly magnetized rotating neutron star that emits beams of electromagnetic radiation.",
  
  // Gas Giants
  [NoteType.Jupiter]: "The largest planet in our solar system, a gas giant more than twice as massive as all other planets combined.",
  [NoteType.Saturn]: "Famous for its stunning ring system, Saturn is a gas giant with a pale yellow hue.",

  // Ice Giants
  [NoteType.Neptune]: "The most distant major planet from the Sun, a dark, cold, and windy ice giant.",
  [NoteType.Uranus]: "An ice giant with a unique tilt, causing it to orbit the Sun on its side.",
  
  // Terrestrial Planets
  [NoteType.Earth]: "Our home planet, the only place known in the universe where life has originated.",
  [NoteType.Venus]: "Earth's 'sister planet' due to their similar size, but with a thick, toxic atmosphere.",
  [NoteType.Mars]: "The 'Red Planet,' known for its dusty, cold, desert world with a very thin atmosphere.",
  [NoteType.Mercury]: "The smallest planet in our solar system and nearest to the Sun.",
  
  // Dwarf Planets
  [NoteType.Pluto]: "An icy dwarf planet in the Kuiper Belt, a ring of bodies beyond the orbit of Neptune.",
  [NoteType.Ceres]: "The largest object in the asteroid belt between Mars and Jupiter, and the only dwarf planet located in the inner solar system.",

  // Other
  [NoteType.Moon]: "A natural satellite orbiting a planet. Earth's Moon stabilizes our planet's wobble.",
  [NoteType.Asteroid]: "A small, rocky object orbiting the Sun. Most are found in the asteroid belt.",
  [NoteType.Comet]: "A cosmic snowball of frozen gases, rock, and dust that orbits the Sun, often leaving a trail of debris.",
};

export const BLACK_HOLE_PROPERTIES = {
    SIZE: 200, // Increased size for a more balanced UI
    PULL_DISTANCE: 320, // Proportional increase
    ABSORB_DISTANCE: 100,  // Proportional increase
};

export const ZOOM_LEVELS = {
  MIN: 0.1,
  MAX: 3.0,
  STEP: 0.1,
};

export const AI_LIMITS = {
    DAILY_REQUESTS: 1500,
    REQUESTS_PER_MINUTE: 15,
};