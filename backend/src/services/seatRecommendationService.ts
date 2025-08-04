import { SunPosition } from './sunPositionService';
import { Waypoint } from './flightPathService';

// Calculate bearing between two points
const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  return bearing;
};

export const getSeatRecommendation = (sunPositions: SunPosition[], flightPath: Waypoint[]): string => {
  // Filter for waypoints where sun is visible (elevation > 0) and not too high (elevation < 80)
  const visibleSunPositions = sunPositions.filter(
    pos => pos.elevation > 0 && pos.elevation < 80
  );

  if (visibleSunPositions.length === 0) {
    return 'No optimal window seat - sun will not be visible during flight';
  }

  // Calculate flight direction (bearing from start to end)
  if (flightPath.length < 2) {
    return 'Unable to determine flight direction';
  }

  const startPoint = flightPath[0];
  const endPoint = flightPath[flightPath.length - 1];
  const flightBearing = calculateBearing(startPoint.lat, startPoint.lon, endPoint.lat, endPoint.lon);

  // Calculate average azimuth during visible periods
  const avgAzimuth = visibleSunPositions.reduce(
    (sum, pos) => sum + pos.azimuth, 
    0
  ) / visibleSunPositions.length;

  // Normalize azimuth to 0-360 degrees
  const normalizedSunAzimuth = ((avgAzimuth % 360) + 360) % 360;

  // Calculate relative sun position based on flight direction
  let relativeSunPosition = normalizedSunAzimuth - flightBearing;
  if (relativeSunPosition < 0) relativeSunPosition += 360;
  if (relativeSunPosition > 360) relativeSunPosition -= 360;

  // Debug logging (disabled for production)
  // console.log('=== SEAT RECOMMENDATION DEBUG ===');
  // console.log('Flight path:', `${startPoint.lat.toFixed(4)},${startPoint.lon.toFixed(4)} → ${endPoint.lat.toFixed(4)},${endPoint.lon.toFixed(4)}`);
  // console.log('Flight bearing (degrees):', flightBearing.toFixed(1));
  // console.log('Average sun azimuth:', avgAzimuth.toFixed(1));
  // console.log('Normalized sun azimuth:', normalizedSunAzimuth.toFixed(1));
  // console.log('Relative sun position:', relativeSunPosition.toFixed(1));

  // Determine seat recommendation based on relative sun position
  // CORRECTED LOGIC: 
  // If sun is on the right side of flight direction (0-180 degrees relative), recommend LEFT window (to look right at sun)
  // If sun is on the left side of flight direction (180-360 degrees relative), recommend RIGHT window (to look left at sun)
  
  if (relativeSunPosition >= 0 && relativeSunPosition <= 180) {
    // console.log('Recommendation: LEFT (sun is', relativeSunPosition.toFixed(1), 'degrees to the right of flight direction - sit on left to look right at sun)');
    return 'left'; // Sit on left side to look right toward the sun
  } else {
    // console.log('Recommendation: RIGHT (sun is', (360 - relativeSunPosition).toFixed(1), 'degrees to the left of flight direction - sit on right to look left at sun)');
    return 'right'; // Sit on right side to look left toward the sun
  }
}; 