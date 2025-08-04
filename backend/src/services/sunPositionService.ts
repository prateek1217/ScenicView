import SunCalc from 'suncalc';
import { Waypoint } from './flightPathService';

export interface SunPosition {
  lat: number;
  lon: number;
  time: string;
  azimuth: number;
  elevation: number;
}

export const calculateSunPositions = (
  waypoints: Waypoint[], 
  departureTime: Date
): SunPosition[] => {
  // Debug logging (can be removed in production)
  // console.log('=== SUN POSITION CALCULATION DEBUG ===');
  // console.log('Departure time:', departureTime.toISOString());
  // console.log('Number of waypoints:', waypoints.length);
  
  return waypoints.map((waypoint, index) => {
    const timeAtWaypoint = new Date(waypoint.time);
    
    // console.log(`Waypoint ${index}: ${timeAtWaypoint.toISOString()} at ${waypoint.lat},${waypoint.lon}`);
    
    // Calculate sun position using SunCalc
    const sunPosition = SunCalc.getPosition(
      timeAtWaypoint,
      waypoint.lat,
      waypoint.lon
    );

    const azimuthDegrees = sunPosition.azimuth * (180 / Math.PI);
    const elevationDegrees = sunPosition.altitude * (180 / Math.PI);
    
    // console.log(`  → Sun: azimuth=${azimuthDegrees.toFixed(1)}°, elevation=${elevationDegrees.toFixed(1)}°`);

    return {
      lat: waypoint.lat,
      lon: waypoint.lon,
      time: waypoint.time,
      azimuth: azimuthDegrees,
      elevation: elevationDegrees
    };
  });
}; 