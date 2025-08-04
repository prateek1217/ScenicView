import React from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteData {
  path: Array<{
    lat: number;
    lon: number;
    time: string;
  }>;
  sunPositions: Array<{
    lat: number;
    lon: number;
    time: string;
    azimuth: number;
    elevation: number;
  }>;
  recommendation: string;
}

interface FlightMapProps {
  routeData: RouteData;
}

const FlightMap: React.FC<FlightMapProps> = ({ routeData }) => {
  // Calculate map bounds to include all points
  const allPoints = [...routeData.path, ...routeData.sunPositions];
  const bounds = allPoints.reduce(
    (acc, point) => {
      return {
        minLat: Math.min(acc.minLat, point.lat),
        maxLat: Math.max(acc.maxLat, point.lat),
        minLon: Math.min(acc.minLon, point.lon),
        maxLon: Math.max(acc.maxLon, point.lon),
      };
    },
    { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 }
  );

  // Create flight path coordinates
  const flightPathCoords = routeData.path.map(point => [point.lat, point.lon]);

  // Get sun position color based on elevation
  const getSunColor = (elevation: number) => {
    if (elevation < 0) return '#1a1a1a'; // Night
    if (elevation < 10) return '#ff6b35'; // Sunrise/sunset
    if (elevation < 30) return '#ffd700'; // Morning/afternoon
    return '#ff4500'; // High sun
  };

  return (
    <MapContainer
      bounds={[
        [bounds.minLat - 0.1, bounds.minLon - 0.1],
        [bounds.maxLat + 0.1, bounds.maxLon + 0.1]
      ]}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Flight path */}
      <Polyline
        positions={flightPathCoords}
        color="#667eea"
        weight={3}
        opacity={0.8}
      >
        <Popup>
          <div>
            <h4>Flight Path</h4>
            <p>From: {routeData.path[0]?.lat.toFixed(4)}, {routeData.path[0]?.lon.toFixed(4)}</p>
            <p>To: {routeData.path[routeData.path.length - 1]?.lat.toFixed(4)}, {routeData.path[routeData.path.length - 1]?.lon.toFixed(4)}</p>
          </div>
        </Popup>
      </Polyline>

      {/* Sun positions */}
      {routeData.sunPositions.map((sunPos, index) => (
        <CircleMarker
          key={index}
          center={[sunPos.lat, sunPos.lon]}
          radius={6}
          fillColor={getSunColor(sunPos.elevation)}
          color={getSunColor(sunPos.elevation)}
          weight={2}
          opacity={0.8}
          fillOpacity={0.6}
        >
          <Popup>
            <div>
              <h4>Sun Position</h4>
              <p><strong>Time:</strong> {new Date(sunPos.time).toLocaleString()}</p>
              <p><strong>Elevation:</strong> {sunPos.elevation.toFixed(1)}°</p>
              <p><strong>Azimuth:</strong> {sunPos.azimuth.toFixed(1)}°</p>
              <p><strong>Position:</strong> {sunPos.lat.toFixed(4)}, {sunPos.lon.toFixed(4)}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Airport markers */}
      <CircleMarker
        center={[routeData.path[0].lat, routeData.path[0].lon]}
        radius={8}
        fillColor="#28a745"
        color="#28a745"
        weight={3}
        fillOpacity={0.8}
      >
        <Popup>
          <div>
            <h4>Departure Airport</h4>
            <p>Position: {routeData.path[0].lat.toFixed(4)}, {routeData.path[0].lon.toFixed(4)}</p>
          </div>
        </Popup>
      </CircleMarker>

      <CircleMarker
        center={[routeData.path[routeData.path.length - 1].lat, routeData.path[routeData.path.length - 1].lon]}
        radius={8}
        fillColor="#dc3545"
        color="#dc3545"
        weight={3}
        fillOpacity={0.8}
      >
        <Popup>
          <div>
            <h4>Arrival Airport</h4>
            <p>Position: {routeData.path[routeData.path.length - 1].lat.toFixed(4)}, {routeData.path[routeData.path.length - 1].lon.toFixed(4)}</p>
          </div>
        </Popup>
      </CircleMarker>
    </MapContainer>
  );
};

export default FlightMap; 