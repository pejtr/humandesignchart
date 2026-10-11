/**
 * Ephemeris calculations using astronomia library (VSOP87)
 * Calculates geocentric ecliptic longitudes for all 13 HD celestial bodies
 * 
 * IMPORTANT: Human Design gate mapping needs geocentric tropical longitudes in the
 * equinox/ecliptic of date. VSOP87 planet.position() provides the date frame; using
 * position2000() here shifts historical charts enough to cross gate/line boundaries.
 */

import { planetposition, julian, solar, moonposition, pluto, coord, precess, base } from "astronomia";

// VSOP87B data (heliocentric spherical coordinates)
import vsop87Bearth from "astronomia/data/vsop87Bearth";
import vsop87Bmercury from "astronomia/data/vsop87Bmercury";
import vsop87Bvenus from "astronomia/data/vsop87Bvenus";
import vsop87Bmars from "astronomia/data/vsop87Bmars";
import vsop87Bjupiter from "astronomia/data/vsop87Bjupiter";
import vsop87Bsaturn from "astronomia/data/vsop87Bsaturn";
import vsop87Buranus from "astronomia/data/vsop87Buranus";
import vsop87Bneptune from "astronomia/data/vsop87Bneptune";

function unwrap(mod: any) {
  return mod?.default || mod;
}

const earth = new planetposition.Planet(unwrap(vsop87Bearth));
const planets: Record<string, any> = {
  Mercury: new planetposition.Planet(unwrap(vsop87Bmercury)),
  Venus: new planetposition.Planet(unwrap(vsop87Bvenus)),
  Mars: new planetposition.Planet(unwrap(vsop87Bmars)),
  Jupiter: new planetposition.Planet(unwrap(vsop87Bjupiter)),
  Saturn: new planetposition.Planet(unwrap(vsop87Bsaturn)),
  Uranus: new planetposition.Planet(unwrap(vsop87Buranus)),
  Neptune: new planetposition.Planet(unwrap(vsop87Bneptune)),
};

const RAD2DEG = 180 / Math.PI;

function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Convert JD to T (Julian centuries from J2000.0)
 */
function jdToT(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

/**
 * Convert heliocentric to geocentric ecliptic longitude
 */
function helioToGeoLon(earthPos: any, planetPos: any): number {
  const eX = earthPos.range * Math.cos(earthPos.lat) * Math.cos(earthPos.lon);
  const eY = earthPos.range * Math.cos(earthPos.lat) * Math.sin(earthPos.lon);
  const pX = planetPos.range * Math.cos(planetPos.lat) * Math.cos(planetPos.lon);
  const pY = planetPos.range * Math.cos(planetPos.lat) * Math.sin(planetPos.lon);
  const lon = Math.atan2(pY - eY, pX - eX);
  return normalizeDeg(lon * RAD2DEG);
}

/**
 * True lunar ascending node from the instantaneous orbital plane.
 *
 * Human Design reference charts use the true node rather than the mean node.
 * `moonposition.trueNode()` is a short periodic approximation and can be off
 * enough to cross a Human Design line boundary.  Deriving the osculating
 * orbital plane from the Moon position/velocity reproduces the reference
 * gate/line values at those boundaries.
 */
function trueNorthNodeLongitude(jd: number): number {
  const dt = 1 / 1440; // one minute in days
  const cartesian = (sampleJd: number): [number, number, number] => {
    const p = moonposition.position(sampleJd);
    const cosLat = Math.cos(p.lat);
    return [
      p.range * cosLat * Math.cos(p.lon),
      p.range * cosLat * Math.sin(p.lon),
      p.range * Math.sin(p.lat),
    ];
  };

  const r = cartesian(jd);
  const before = cartesian(jd - dt);
  const after = cartesian(jd + dt);
  const v: [number, number, number] = [
    (after[0] - before[0]) / (2 * dt),
    (after[1] - before[1]) / (2 * dt),
    (after[2] - before[2]) / (2 * dt),
  ];

  const h: [number, number, number] = [
    r[1] * v[2] - r[2] * v[1],
    r[2] * v[0] - r[0] * v[2],
    r[0] * v[1] - r[1] * v[0],
  ];

  // n = k × h, the ascending-node vector in the ecliptic plane.
  return normalizeDeg(Math.atan2(h[0], -h[1]) * RAD2DEG);
}

/**
 * Geocentric ecliptic longitude of Pluto in the equinox/ecliptic of date.
 * `pluto.heliocentric()` is J2000, so convert the Earth/Pluto vector to a
 * geocentric J2000 direction and precess it to the date before gate mapping.
 */
function plutoLongitude(jd: number): number {
  const earthPos = earth.position2000(jd);
  const plutoPos = pluto.heliocentric(jd);

  const eX = earthPos.range * Math.cos(earthPos.lat) * Math.cos(earthPos.lon);
  const eY = earthPos.range * Math.cos(earthPos.lat) * Math.sin(earthPos.lon);
  const eZ = earthPos.range * Math.sin(earthPos.lat);
  const pX = plutoPos.range * Math.cos(plutoPos.lat) * Math.cos(plutoPos.lon);
  const pY = plutoPos.range * Math.cos(plutoPos.lat) * Math.sin(plutoPos.lon);
  const pZ = plutoPos.range * Math.sin(plutoPos.lat);

  const x = pX - eX;
  const y = pY - eY;
  const z = pZ - eZ;
  const lonJ2000 = Math.atan2(y, x);
  const latJ2000 = Math.atan2(z, Math.hypot(x, y));
  const epoch = base.JDEToJulianYear(jd);
  const eclipticOfDate = precess.eclipticPosition(
    new coord.Ecliptic(lonJ2000, latJ2000),
    2000.0,
    epoch,
    0,
    0,
  );
  return normalizeDeg(eclipticOfDate.lon * RAD2DEG);
}

export interface PlanetaryPositions {
  Sun: number;
  Earth: number;
  Moon: number;
  "North Node": number;
  "South Node": number;
  Mercury: number;
  Venus: number;
  Mars: number;
  Jupiter: number;
  Saturn: number;
  Uranus: number;
  Neptune: number;
  Pluto: number;
}

/**
 * Calculate all planetary positions for a given Julian Day
 */
export function calculatePlanetaryPositions(jd: number): PlanetaryPositions {
  const T = jdToT(jd);
  
  // Sun (apparent geocentric ecliptic longitude)
  // solar.apparentLongitude takes T (Julian centuries from J2000), NOT JD
  const sunLon = normalizeDeg(solar.apparentLongitude(T) * RAD2DEG);
  
  // Earth (opposite of Sun)
  const earthLon = normalizeDeg(sunLon + 180);
  
  // Moon
  const moonPos = moonposition.position(jd);
  const moonLon = normalizeDeg(moonPos.lon * RAD2DEG);
  
  // True North & South lunar nodes
  const northNodeLon = trueNorthNodeLongitude(jd);
  const southNodeLon = normalizeDeg(northNodeLon + 180);
  
  // Planets: heliocentric VSOP87 in equinox/ecliptic of date → geocentric longitude
  const earthHelio = earth.position(jd);
  
  const planetLons: Record<string, number> = {};
  for (const [name, planet] of Object.entries(planets)) {
    const pos = planet.position(jd);
    planetLons[name] = helioToGeoLon(earthHelio, pos);
  }
  
  // Pluto: geocentric, precessed from J2000 to ecliptic of date
  const plutoLon = plutoLongitude(jd);
  
  return {
    Sun: sunLon,
    Earth: earthLon,
    Moon: moonLon,
    "North Node": northNodeLon,
    "South Node": southNodeLon,
    Mercury: planetLons.Mercury,
    Venus: planetLons.Venus,
    Mars: planetLons.Mars,
    Jupiter: planetLons.Jupiter,
    Saturn: planetLons.Saturn,
    Uranus: planetLons.Uranus,
    Neptune: planetLons.Neptune,
    Pluto: plutoLon,
  };
}

/**
 * Convert a Julian Day to calendar date
 */
export function jdToCalendar(jd: number): { year: number; month: number; day: number } {
  const result = julian.JDToCalendar(jd);
  return { year: result.year, month: result.month, day: result.day };
}

/**
 * Convert a Date to Julian Day
 */
export function dateToJD(date: Date): number {
  return julian.CalendarGregorianToJD(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate() + date.getUTCHours() / 24 + date.getUTCMinutes() / 1440 + date.getUTCSeconds() / 86400
  );
}

/**
 * Find the Design date (when Sun was 88° behind birth Sun position)
 * This is approximately 88 days before birth
 */
export function findDesignDate(birthJD: number): number {
  const birthPositions = calculatePlanetaryPositions(birthJD);
  const targetSunLon = normalizeDeg(birthPositions.Sun - 88);
  
  // Start approximately 88 days before birth
  let jd = birthJD - 88;
  
  // Iterative Newton-Raphson search (Sun moves ~0.9856° per day)
  for (let i = 0; i < 30; i++) {
    const pos = calculatePlanetaryPositions(jd);
    let diff = targetSunLon - pos.Sun;
    
    // Handle wrap-around (shortest arc)
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    if (Math.abs(diff) < 0.0001) break;
    
    // Sun moves approximately 0.9856° per day
    jd += diff / 0.9856;
  }
  
  return jd;
}
