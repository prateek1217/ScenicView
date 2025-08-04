// Airport coordinates (latitude, longitude)
export const AIRPORTS: Record<string, [number, number]> = {
  // Indian Cities
  'DEL': [28.5562, 77.1000], // Delhi
  'JAI': [26.8282, 75.8056], // Jaipur
  'BLR': [12.9716, 77.5946], // Bangalore (Kempegowda International Airport)
  'BOM': [19.0896, 72.8656], // Mumbai (Chhatrapati Shivaji Maharaj International Airport)
  'BHO': [23.2875, 77.3374], // Bhopal (Raja Bhoj Airport)
  'LKO': [26.7606, 80.8893], // Lucknow (Chaudhary Charan Singh International Airport)
  
  // International Cities - Perfect for Sun Variations
  'JFK': [40.6413, -73.7781], // New York (John F. Kennedy International Airport)
  'LHR': [51.4700, -0.4543], // London (Heathrow Airport)
  'NRT': [35.7720, 140.3929], // Tokyo (Narita International Airport)
  'LAX': [33.9425, -118.4081], // Los Angeles (Los Angeles International Airport)
  'DXB': [25.2532, 55.3657], // Dubai (Dubai International Airport)
  'SIN': [1.3644, 103.9915], // Singapore (Singapore Changi Airport)
  'SYD': [-33.9399, 151.1753], // Sydney (Kingsford Smith Airport)
  'CDG': [49.0097, 2.5479], // Paris (Charles de Gaulle Airport)
  'FRA': [50.0379, 8.5622], // Frankfurt (Frankfurt Airport)
  'HKG': [22.3080, 113.9185], // Hong Kong (Hong Kong International Airport)
  'ICN': [37.4602, 126.4407], // Seoul (Incheon International Airport)
  'BKK': [13.6900, 100.7501], // Bangkok (Suvarnabhumi Airport)
  'DOH': [25.2731, 51.6080], // Doha (Hamad International Airport)
  'IST': [41.2753, 28.7519], // Istanbul (Istanbul Airport)
  'MAD': [40.4839, -3.5680], // Madrid (Adolfo Suárez Madrid-Barajas Airport)
};

export interface Waypoint {
  lat: number;
  lon: number;
  time: string;
}

// Simple great circle calculation
function calculateGreatCircle(from: [number, number], to: [number, number], fraction: number): [number, number] {
  const lat1 = from[0] * Math.PI / 180;
  const lon1 = from[1] * Math.PI / 180;
  const lat2 = to[0] * Math.PI / 180;
  const lon2 = to[1] * Math.PI / 180;

  const d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon2 - lon1) / 2), 2)
  ));

  const A = Math.sin((1 - fraction) * d) / Math.sin(d);
  const B = Math.sin(fraction * d) / Math.sin(d);

  const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lon = Math.atan2(y, x);

  return [lat * 180 / Math.PI, lon * 180 / Math.PI];
}

export const calculateFlightPath = (
  fromAirport: string, 
  toAirport: string, 
  departureTime: Date
): Waypoint[] => {
  const fromCoords = AIRPORTS[fromAirport.toUpperCase()];
  const toCoords = AIRPORTS[toAirport.toUpperCase()];

  if (!fromCoords || !toCoords) {
    throw new Error(`Airport not found: ${fromAirport} or ${toAirport}`);
  }

  // Calculate distance (simplified)
  const lat1 = fromCoords[0] * Math.PI / 180;
  const lon1 = fromCoords[1] * Math.PI / 180;
  const lat2 = toCoords[0] * Math.PI / 180;
  const lon2 = toCoords[1] * Math.PI / 180;
  
  const distance = 6371 * Math.acos(
    Math.sin(lat1) * Math.sin(lat2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  );

  // Generate waypoints along the path (every 50km)
  const numWaypoints = Math.max(5, Math.floor(distance / 50));
  
  const waypoints: Waypoint[] = [];
  
  for (let i = 0; i <= numWaypoints; i++) {
    const fraction = i / numWaypoints;
    const [lat, lon] = calculateGreatCircle(fromCoords, toCoords, fraction);
    
    // Calculate time at this waypoint (assuming constant speed)
    const flightDuration = distance / 800; // Assuming 800 km/h average speed
    const timeAtWaypoint = new Date(departureTime.getTime() + (fraction * flightDuration * 60 * 60 * 1000));
    
    waypoints.push({
      lat,
      lon,
      time: timeAtWaypoint.toISOString()
    });
  }

  return waypoints;
}; 