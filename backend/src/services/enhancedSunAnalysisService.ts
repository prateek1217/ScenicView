import SunCalc from 'suncalc';
import { AIRPORTS } from './flightPathService';

export interface SunCondition {
  time: Date;
  timeString: string;
  lat: number;
  lon: number;
  sunElevation: number;
  sunAzimuth: number;
  condition: 'NIGHT' | 'TWILIGHT' | 'GOLDEN_HOUR' | 'DAYLIGHT';
  progressPercent: number;
}

export interface SunEvent {
  time: Date;
  timeString: string;
  location: string;
  lat: number;
  lon: number;
  progressPercent: number;
}

export interface FlightSunAnalysis {
  willSeeSunrise: boolean;
  willSeeSunset: boolean;
  willSeeNight: boolean;
  willSeeGoldenHour: boolean;
  sunrise?: SunEvent;
  sunset?: SunEvent;
  summary: string[];
  recommendations: string[];
  seatSuggestion: 'left' | 'right' | 'either';
  timeline: SunCondition[];
  nightDuration?: number; // minutes of night flight
  dayDuration?: number;   // minutes of day flight
}

/**
 * Enhanced flight sun analysis that determines what sun conditions 
 * the user will experience during their flight
 */
export const analyzeFlightSunConditions = (
  fromAirport: string,
  toAirport: string,
  departureDate: string,    // "2024-01-15"
  departureTime: string,    // "14:30"
  flightDuration: number    // hours
): FlightSunAnalysis => {
  
  // Get airport coordinates
  const fromCoords = AIRPORTS[fromAirport];
  const toCoords = AIRPORTS[toAirport];
  
  if (!fromCoords || !toCoords) {
    throw new Error(`Airport not found: ${fromAirport} or ${toAirport}`);
  }

  // Calculate flight timeline
  const startTime = new Date(`${departureDate}T${departureTime}:00Z`);
  const endTime = new Date(startTime.getTime() + (flightDuration * 60 * 60 * 1000));
  
  console.log(`=== ENHANCED SUN ANALYSIS ===`);
  console.log(`Flight: ${fromAirport} → ${toAirport}`);
  console.log(`Departure: ${startTime.toISOString()}`);
  console.log(`Arrival: ${endTime.toISOString()}`);
  console.log(`Duration: ${flightDuration} hours`);

  // Generate sampling points along flight path
  const samplingPoints = generateFlightSamplingPoints(
    fromCoords, 
    toCoords, 
    startTime, 
    flightDuration
  );

  // Calculate sun conditions for each sampling point
  const sunAnalysis = analyzeSunConditions(samplingPoints);

  // Detect sunrise/sunset events
  const events = detectSunEvents(sunAnalysis);

  // Generate user-friendly report
  const report = generateFlightSunReport(events, sunAnalysis, fromAirport, toAirport);

  return report;
};

/**
 * Generate sampling points along the flight path every 15 minutes
 */
const generateFlightSamplingPoints = (
  fromCoords: [number, number],
  toCoords: [number, number], 
  startTime: Date,
  duration: number
) => {
  const samplingPoints = [];
  const totalMinutes = duration * 60;
  const intervalMinutes = 15; // Sample every 15 minutes for precision
  
  for (let minutes = 0; minutes <= totalMinutes; minutes += intervalMinutes) {
    const fraction = minutes / totalMinutes;
    const currentTime = new Date(startTime.getTime() + (minutes * 60 * 1000));
    
    // Calculate position along great circle path
    const position = interpolateGreatCircle(fromCoords, toCoords, fraction);
    
    samplingPoints.push({
      time: currentTime,
      lat: position[0],
      lon: position[1],
      progressPercent: fraction * 100
    });
  }
  
  console.log(`Generated ${samplingPoints.length} sampling points`);
  return samplingPoints;
};

/**
 * Calculate great circle interpolation between two points
 */
const interpolateGreatCircle = (
  from: [number, number], 
  to: [number, number], 
  fraction: number
): [number, number] => {
  if (fraction <= 0) return from;
  if (fraction >= 1) return to;

  const lat1 = from[0] * Math.PI / 180;
  const lon1 = from[1] * Math.PI / 180;
  const lat2 = to[0] * Math.PI / 180;
  const lon2 = to[1] * Math.PI / 180;

  const d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
  ));

  const a = Math.sin((1 - fraction) * d) / Math.sin(d);
  const b = Math.sin(fraction * d) / Math.sin(d);

  const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
  const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
  const z = a * Math.sin(lat1) + b * Math.sin(lat2);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lon = Math.atan2(y, x);

  return [lat * 180 / Math.PI, lon * 180 / Math.PI];
};

/**
 * Analyze sun conditions for each sampling point
 */
const analyzeSunConditions = (samplingPoints: any[]): SunCondition[] => {
  return samplingPoints.map(point => {
    // Use SunCalc for precise astronomical calculations
    const sunPos = SunCalc.getPosition(point.time, point.lat, point.lon);
    const elevation = sunPos.altitude * (180 / Math.PI);
    const azimuth = sunPos.azimuth * (180 / Math.PI);
    
    return {
      time: point.time,
      timeString: point.time.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      lat: point.lat,
      lon: point.lon,
      sunElevation: elevation,
      sunAzimuth: azimuth,
      condition: classifySunCondition(elevation),
      progressPercent: point.progressPercent
    };
  });
};

/**
 * Classify sun condition based on elevation angle
 */
const classifySunCondition = (elevation: number): 'NIGHT' | 'TWILIGHT' | 'GOLDEN_HOUR' | 'DAYLIGHT' => {
  if (elevation < 0) return 'NIGHT';            // Night (sun below horizon)
  if (elevation < 6) return 'TWILIGHT';         // Civil twilight  
  if (elevation < 10) return 'GOLDEN_HOUR';     // Sunrise/Sunset golden hour
  return 'DAYLIGHT';                            // Full daylight
};

/**
 * Detect sunrise/sunset events during the flight
 */
const detectSunEvents = (sunAnalysis: SunCondition[]) => {
  const events = {
    sunrise: null as SunEvent | null,
    sunset: null as SunEvent | null,
    willSeeNight: false,
    willSeeSunrise: false,
    willSeeSunset: false,
    willSeeGoldenHour: false,
    nightMinutes: 0,
    dayMinutes: 0,
    goldenHourMinutes: 0
  };
  
  // Track duration of different conditions
  const intervalMinutes = 15;
  
  for (let i = 0; i < sunAnalysis.length; i++) {
    const current = sunAnalysis[i];
    
    // Count duration of each condition
    if (current.condition === 'NIGHT') {
      events.willSeeNight = true;
      events.nightMinutes += intervalMinutes;
    } else if (current.condition === 'DAYLIGHT') {
      events.dayMinutes += intervalMinutes;
    } else if (current.condition === 'GOLDEN_HOUR') {
      events.willSeeGoldenHour = true;
      events.goldenHourMinutes += intervalMinutes;
    } else if (current.condition === 'TWILIGHT') {
      // Twilight periods also count as night for viewing purposes
      events.willSeeNight = true;
      events.nightMinutes += intervalMinutes;
    }
    
    // Detect transitions (events)
    if (i > 0) {
      const prev = sunAnalysis[i-1];
      
      // SUNRISE DETECTION: Sun crosses from below to above horizon
      if (prev.sunElevation <= 0 && current.sunElevation > 0) {
        events.sunrise = {
          time: current.time,
          timeString: current.timeString,
          location: `${current.lat.toFixed(2)}°, ${current.lon.toFixed(2)}°`,
          lat: current.lat,
          lon: current.lon,
          progressPercent: current.progressPercent
        };
        events.willSeeSunrise = true;
        console.log(`🌅 Sunrise detected at ${current.timeString}`);
      }
      
      // SUNSET DETECTION: Sun crosses from above to below horizon  
      if (prev.sunElevation > 0 && current.sunElevation <= 0) {
        events.sunset = {
          time: current.time,
          timeString: current.timeString,
          location: `${current.lat.toFixed(2)}°, ${current.lon.toFixed(2)}°`,
          lat: current.lat,
          lon: current.lon,
          progressPercent: current.progressPercent
        };
        events.willSeeSunset = true;
        console.log(`🌇 Sunset detected at ${current.timeString}`);
      }
    }
  }
  
  return events;
};

/**
 * Generate user-friendly flight sun report
 */
const generateFlightSunReport = (
  events: any, 
  sunAnalysis: SunCondition[],
  fromAirport: string,
  toAirport: string
): FlightSunAnalysis => {
  
  const report: FlightSunAnalysis = {
    willSeeSunrise: events.willSeeSunrise,
    willSeeSunset: events.willSeeSunset,
    willSeeNight: events.willSeeNight,
    willSeeGoldenHour: events.willSeeGoldenHour,
    sunrise: events.sunrise,
    sunset: events.sunset,
    summary: [],
    recommendations: [], // Empty array - recommendations removed from UI
    seatSuggestion: 'either',
    timeline: sunAnalysis,
    nightDuration: events.nightMinutes,
    dayDuration: events.dayMinutes
  };
  
  // Update the report with the corrected night detection
  report.willSeeNight = events.willSeeNight;
  report.nightDuration = events.nightMinutes;
  
  // Build summary messages
  if (events.willSeeSunrise && events.willSeeSunset) {
    report.summary.push(`🌟 Amazing! You'll see BOTH sunrise AND sunset during this flight!`);
    report.summary.push(`🌅 Sunrise at ${events.sunrise.timeString}`);
    report.summary.push(`🌇 Sunset at ${events.sunset.timeString}`);
    report.seatSuggestion = 'either';
    report.recommendations.push("This is a rare treat! You'll experience the full sun cycle during your journey.");
    
    // CRITICAL FIX: If both sunrise and sunset occur, there MUST be night periods
    // Force willSeeNight to true and calculate night duration
    if (!events.willSeeNight) {
      events.willSeeNight = true;
      // Estimate night duration as the time between sunset and sunrise
      if (events.sunset && events.sunrise) {
        const sunsetTime = new Date(events.sunset.time);
        const sunriseTime = new Date(events.sunrise.time);
        const nightDurationMs = sunriseTime.getTime() - sunsetTime.getTime();
        events.nightMinutes = Math.max(0, nightDurationMs / (1000 * 60));
      } else {
        // Fallback: estimate night duration as 25% of flight time
        // We need to get flightDuration from the function parameters
        const estimatedFlightDuration = 6; // Default fallback
        events.nightMinutes = Math.round(estimatedFlightDuration * 60 * 0.25);
      }
    }
    
    if (events.willSeeNight) {
      const nightHours = Math.round(events.nightMinutes / 60 * 10) / 10;
      report.summary.push(`🌙 You'll also experience ${nightHours} hours of night flying - perfect for stargazing!`);
    }
  } else if (events.willSeeSunrise) {
    report.summary.push(`🌅 You WILL see a beautiful sunrise at ${events.sunrise.timeString}!`);
    report.seatSuggestion = determineSeatSideForSunrise(fromAirport, toAirport);
    report.recommendations.push(`Choose a window seat on the ${report.seatSuggestion === 'right' ? 'RIGHT (E, F)' : 'LEFT (A, B)'} side for the best sunrise views.`);
  } else if (events.willSeeSunset) {
    report.summary.push(`🌇 You WILL see a stunning sunset at ${events.sunset.timeString}!`);
    report.seatSuggestion = determineSeatSideForSunset(fromAirport, toAirport);
    report.recommendations.push(`Choose a window seat on the ${report.seatSuggestion === 'right' ? 'RIGHT (E, F)' : 'LEFT (A, B)'} side for the best sunset views.`);
  }
  
  if (events.willSeeNight) {
    const nightHours = Math.round(events.nightMinutes / 60 * 10) / 10;
    report.summary.push(`🌙 You'll experience ${nightHours} hours of night flying - perfect for stargazing!`);
    report.recommendations.push("Great opportunity for night photography and seeing city lights from above.");
  }
  
  if (events.willSeeGoldenHour) {
    const goldenHours = Math.round(events.goldenHourMinutes / 60 * 10) / 10;
    report.summary.push(`✨ You'll enjoy ${goldenHours} hours of golden hour lighting!`);
  }
  
  if (!events.willSeeSunrise && !events.willSeeSunset && !events.willSeeNight) {
    report.summary.push(`☀️ This will be a bright daylight flight with excellent visibility.`);
    report.recommendations.push("Perfect for scenic landscape viewing and aerial photography.");
  }
  
  // Add flight-specific recommendations
  if (events.willSeeSunrise || events.willSeeSunset) {
    report.recommendations.push("Bring a camera - the views will be spectacular!");
    report.recommendations.push("Consider booking an earlier check-in to secure your preferred window seat.");
  }
  
  console.log(`Analysis complete: Sunrise=${events.willSeeSunrise}, Sunset=${events.willSeeSunset}, Night=${events.willSeeNight}`);
  
  return report;
};

/**
 * Determine best seat side for sunrise viewing based on flight direction
 */
const determineSeatSideForSunrise = (fromAirport: string, toAirport: string): 'left' | 'right' | 'either' => {
  const fromCoords = AIRPORTS[fromAirport];
  const toCoords = AIRPORTS[toAirport];
  
  // Calculate general flight bearing
  const dLon = toCoords[1] - fromCoords[1];
  const lat1 = fromCoords[0] * Math.PI / 180;
  const lat2 = toCoords[0] * Math.PI / 180;
  const dLonRad = dLon * Math.PI / 180;
  
  const y = Math.sin(dLonRad) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLonRad);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  
  // Sun rises in the east (90°)
  // If flying north/south, east side is right
  // If flying east/west, depends on exact direction
  if (bearing >= 315 || bearing < 45) return 'right';  // Flying north - east is right
  if (bearing >= 45 && bearing < 135) return 'right';  // Flying east - sun behind/side
  if (bearing >= 135 && bearing < 225) return 'left';  // Flying south - east is left  
  if (bearing >= 225 && bearing < 315) return 'left';  // Flying west - sun ahead/side
  
  return 'either';
};

/**
 * Determine best seat side for sunset viewing based on flight direction
 */
const determineSeatSideForSunset = (fromAirport: string, toAirport: string): 'left' | 'right' | 'either' => {
  const fromCoords = AIRPORTS[fromAirport];
  const toCoords = AIRPORTS[toAirport];
  
  // Calculate general flight bearing
  const dLon = toCoords[1] - fromCoords[1];
  const lat1 = fromCoords[0] * Math.PI / 180;
  const lat2 = toCoords[0] * Math.PI / 180;
  const dLonRad = dLon * Math.PI / 180;
  
  const y = Math.sin(dLonRad) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLonRad);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  
  // Sun sets in the west (270°)
  // If flying north/south, west side is left
  // If flying east/west, depends on exact direction
  if (bearing >= 315 || bearing < 45) return 'left';   // Flying north - west is left
  if (bearing >= 45 && bearing < 135) return 'left';   // Flying east - sun ahead/side
  if (bearing >= 135 && bearing < 225) return 'right'; // Flying south - west is right
  if (bearing >= 225 && bearing < 315) return 'right'; // Flying west - sun behind/side
  
  return 'either';
};