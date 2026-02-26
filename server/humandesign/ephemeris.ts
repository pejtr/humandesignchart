/**
 * Ephemeris calculations using astronomia library (VSOP87)
 * Calculates geocentric ecliptic longitudes for all 13 HD celestial bodies
 * 
 * IMPORTANT: astronomia's solar.apparentLongitude takes T (Julian centuries from J2000),
 * NOT Julian Day numbers. Planet.position2000 also takes JDE (Julian Ephemeris Day).
 */

// @ts-ignore - astronomia doesn't have perfect TS types
import { planetposition, julian, solar, moonposition } from "astronomia";

// VSOP87B data (heliocentric spherical coordinates)
// @ts-ignore
import vsop87Bearth from "astronomia/data/vsop87Bearth";
// @ts-ignore
import vsop87Bmercury from "astronomia/data/vsop87Bmercury";
// @ts-ignore
import vsop87Bvenus from "astronomia/data/vsop87Bvenus";
// @ts-ignore
import vsop87Bmars from "astronomia/data/vsop87Bmars";
// @ts-ignore
import vsop87Bjupiter from "astronomia/data/vsop87Bjupiter";
// @ts-ignore
import vsop87Bsaturn from "astronomia/data/vsop87Bsaturn";
// @ts-ignore
import vsop87Buranus from "astronomia/data/vsop87Buranus";
// @ts-ignore
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
 * Calculate mean longitude of Moon's ascending node (Meeus Ch. 47)
 */
function meanNorthNode(T: number): number {
  const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
  return normalizeDeg(omega);
}

/**
 * Simplified Pluto longitude (Meeus Ch. 37 polynomial + corrections)
 */
function plutoLongitude(T: number): number {
  const J = 34.35 + 3034.9057 * T;
  const S = 50.08 + 1222.1138 * T;
  const P = 238.96 + 144.9600 * T;
  
  const Jrad = J * Math.PI / 180;
  const Srad = S * Math.PI / 180;
  const Prad = P * Math.PI / 180;
  
  let lon = 238.958116 + 144.9600 * T;
  
  // Main perturbation terms
  lon += -19.799805 * Math.sin(Prad) + 19.850055 * Math.cos(Prad);
  lon += 0.897144 * Math.sin(2 * Prad) - 4.956699 * Math.cos(2 * Prad);
  lon += 0.610820 * Math.sin(3 * Prad) + 1.210476 * Math.cos(3 * Prad);
  lon += -0.341639 * Math.sin(4 * Prad) - 0.190541 * Math.cos(4 * Prad);
  lon += 0.036181 * Math.sin(5 * Prad) - 0.004539 * Math.cos(5 * Prad);
  lon += 0.016684 * Math.sin(6 * Prad) + 0.000518 * Math.cos(6 * Prad);
  lon += -4.387478 * Math.sin(Srad - Prad) + 7.440062 * Math.cos(Srad - Prad);
  lon += 2.225400 * Math.sin(Jrad - Prad) - 1.527490 * Math.cos(Jrad - Prad);
  
  return normalizeDeg(lon);
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
  
  // North & South Node (use T, not JD)
  const northNodeLon = meanNorthNode(T);
  const southNodeLon = normalizeDeg(northNodeLon + 180);
  
  // Outer planets (geocentric from heliocentric VSOP87)
  // position2000 takes JDE (Julian Ephemeris Day)
  const earthHelio = earth.position2000(jd);
  
  const planetLons: Record<string, number> = {};
  for (const [name, planet] of Object.entries(planets)) {
    const pos = planet.position2000(jd);
    planetLons[name] = helioToGeoLon(earthHelio, pos);
  }
  
  // Pluto (simplified, uses T)
  const plutoLon = plutoLongitude(T);
  
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
