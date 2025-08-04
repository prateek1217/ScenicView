#  ScenicView 

A sophisticated web application that helps air travelers pick the best  seat for sunrise, sunset, night/moon and mountain views by calculating flight paths and sun positions. Features an interactive 2D map and immersive 3D cockpit view.

## 🚀 Features

### Core Functionality
- **Flight Path Calculation**: Uses great-circle routes between airports with precise waypoint generation
- **Sun Position Tracking**: Calculates sun azimuth and elevation along the flight path using astronomical algorithms
- **Intelligent Seat Recommendations**: Recommends left or right window seats based on sun position analysis
- **Real-time Calculations**: Uses actual astronomical calculations for accurate results

### Interactive Visualizations
- **2D Interactive Map**: Displays flight path and sun positions using Leaflet.js with OpenStreetMap
- **3D Cockpit View**: Immersive Three.js experience with airplane model and sun positioning
- **Dynamic Sun Movement**: Real-time sun position updates in both 2D and 3D views
- **Time-based Visualization**: Color-coded markers based on sun elevation and time of day

### Advanced UI/UX
- **Modern Design**: Clean, professional interface with gradient backgrounds and smooth animations
- **Responsive Layout**: Adapts to different screen sizes with resizable panels
- **Interactive Controls**: Intuitive date/time picker and airport selection
- **Real-time Updates**: Live sun position tracking and seat recommendations

## 🛠️ Tech Stack

### Backend
- **Node.js** with **Express** and **TypeScript**
- **SunCalc** for precise astronomical calculations
- **Turf.js** for geodesic path calculations and bearing computations
- **CORS** enabled for seamless frontend communication

### Frontend
- **React 18** with **TypeScript** for type-safe development
- **React Leaflet** for interactive 2D maps with custom markers
- **Three.js** for immersive 3D cockpit experience
- **Axios** for robust API communication
- **Modern CSS** with CSS Grid, Flexbox, and gradient designs
- **React Hooks** for efficient state management

### Development Tools
- **TypeScript** for type safety across the entire stack
- **npm** for package management
- **Concurrent development** with multiple server support

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

### Quick Setup
1. **Clone the repository** (if applicable)
2. **Install all dependencies at once**:
   ```bash
   npm run install:all
   ```

### Manual Installation
1. **Install backend dependencies**:
   ```bash
   npm install
   ```

2. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   ```

## 🚀 Running the Application

### Development Mode (Recommended)
Run both backend and frontend simultaneously:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend development server on `http://localhost:3000`

### Individual Development Servers
- **Backend only**: `npm run dev:backend`
- **Frontend only**: `npm run dev:frontend`

### Production Build
```bash
npm run build
npm start
```

## 🎯 How to Use

### Basic Usage
1. **Select Airports**: Choose departure (DEL) and arrival (JAI) airports from the dropdown
2. **Pick Departure Time**: Use the date and time picker to select your flight departure
3. **Get Recommendation**: Click "Find My Seat" to receive your window seat recommendation
4. **Explore Visualizations**: 
   - View the 2D map showing flight path and sun positions
   - Switch to 3D cockpit view for immersive experience
   - Watch real-time sun movement along the flight path

### Advanced Features
- **Time Slider**: Adjust the time to see how sun position changes during the flight
- **Panel Resizing**: Drag panel dividers to customize your view layout
- **Map Interactions**: Zoom, pan, and click on markers for detailed information
- **3D Controls**: Use mouse to rotate, zoom, and navigate the 3D cockpit view

## 📡 API Endpoints

### GET `/api/route`
Calculates flight path and sun positions with comprehensive analysis.

**Query Parameters:**
- `from`: Departure airport code (e.g., "DEL")
- `to`: Arrival airport code (e.g., "JAI") 
- `depart`: Departure time in ISO 8601 format (e.g., "2025-08-01T18:00")

**Response:**
```json
{
  "path": [
    {
      "lat": 28.5562,
      "lon": 77.1000,
      "time": "2025-08-01T18:00:00.000Z",
      "bearing": 225.5,
      "distance": 0
    }
  ],
  "sunPositions": [
    {
      "lat": 28.5562,
      "lon": 77.1000,
      "time": "2025-08-01T18:00:00.000Z",
      "azimuth": 270.5,
      "elevation": 15.2,
      "isVisible": true,
      "timeOfDay": "sunset"
    }
  ],
  "recommendation": {
    "seat": "left",
    "reason": "Sun will be on the left side during visible periods",
    "confidence": 0.85
  },
  "flightInfo": {
    "duration": "1h 15m",
    "distance": 250,
    "waypoints": 15
  }
}
```

### GET `/health`
Health check endpoint for monitoring.

## 🗺️ Supported Airports

Currently supported airports:
- **DEL** - Delhi, India (28.5562, 77.1000)
- **JAI** - Jaipur, India (26.8282, 75.8056)

*More airports can be easily added by updating the configuration*

## 🎨 Features in Detail

### Flight Path Calculation
- **Great-circle Distance**: Uses spherical trigonometry for accurate flight paths
- **Waypoint Generation**: Creates points every ~50km along the route for precision
- **Bearing Calculations**: Computes airplane orientation for 3D positioning
- **Duration Estimation**: Calculates flight time based on 800 km/h average speed
- **Distance Tracking**: Provides cumulative distance from departure

### Sun Position Analysis
- **Astronomical Precision**: Uses SunCalc library for accurate sun calculations
- **Time-based Filtering**: Only considers sun positions during flight duration
- **Visibility Logic**: Filters for visible sun positions (elevation > 0° and < 80°)
- **Time of Day Classification**: Categorizes positions as sunrise, sunset, day, or night
- **Azimuth Analysis**: Determines sun position relative to flight direction

### Seat Recommendation Logic
- **Smart Analysis**: Analyzes average sun azimuth during visible periods
- **Left Window (A seats)**: Recommended when sun is on the left (90-270°)
- **Right Window (F seats)**: Recommended when sun is on the right (270-90°)
- **Confidence Scoring**: Provides confidence level based on sun visibility duration
- **Reasoning**: Explains the recommendation with clear logic

### 2D Interactive Map Features
- **Flight Path**: Blue line showing the great-circle route with waypoints
- **Sun Positions**: Color-coded markers based on sun elevation and time:
  - 🟠 Orange: Sunrise/sunset  - Golden hour views
  - 🟡 Yellow: Morning/afternoon  - Good visibility
  - 🔴 Red: High sun - Bright conditions
  - ⚫ Black: Night  - No sun visibility
- **Airports**: Green (departure) and red (arrival) markers with labels
- **Interactive Popups**: Click markers for detailed information
- **Zoom Controls**: Smooth zoom and pan functionality

### 3D Cockpit Experience
- **Immersive Environment**: Full 3D scene with airplane model
- **Dynamic Sun Positioning**: Real-time sun movement in 3D space
- **Camera Controls**: Mouse-based rotation, zoom, and pan
- **Lighting Effects**: Dynamic lighting based on sun position
- **Time Synchronization**: 3D view updates with 2D map time slider
- **Realistic Geometry**: Custom airplane model with proper proportions

### Advanced UI Components
- **Resizable Panels**: Drag to resize map and control panels
- **Time Slider**: Interactive slider for time-based visualization
- **Responsive Design**: Adapts to different screen sizes
- **Loading States**: Smooth loading indicators for better UX
- **Error Handling**: Graceful error messages and fallbacks
- **Modern Styling**: Gradient backgrounds and professional design

## 🔧 Development

### Project Structure
```
Flight/
├── src/                    # Backend source
│   ├── server.ts          # Express server setup
│   ├── routes/            # API route handlers
│   │   └── routeHandler.ts # Main route logic
│   └── services/          # Business logic services
│       ├── flightPathService.ts    # Flight calculations
│       ├── sunPositionService.ts   # Astronomical calculations
│       └── seatRecommendationService.ts # Seat logic
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main app component
│   │   └── App.css        # Styling
│   └── public/            # Static assets
├── package.json           # Backend dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

### Key Scripts
- `npm run dev`: Start both backend and frontend
- `npm run dev:backend`: Start backend only
- `npm run dev:frontend`: Start frontend only
- `npm run install:all`: Install all dependencies
- `npm run build`: Build for production
- `npm start`: Start production server

### Adding New Airports
To add new airports, update the `AIRPORTS` object in `src/services/flightPathService.ts`:



### Development Best Practices
- **Type Safety**: All code is written in TypeScript for better development experience
- **Component Architecture**: Modular React components for maintainability
- **Service Layer**: Separated business logic in backend services
- **Error Handling**: Comprehensive error handling throughout the application
- **Performance**: Optimized calculations and efficient rendering

## 🚀 Future Enhancements

### Planned Features
- [ ] **Global Airport Database**: Add thousands of airports worldwide
- [ ] **Weather Integration**: Real-time weather data for more accurate recommendations
- [ ] **Multiple Aircraft Types**: Different airplane models and seating configurations
- [ ] **Flight Class Support**: Economy, Business, and First Class considerations
- [ ] **Mobile App**: Native mobile application for iOS and Android
- [ ] **Offline Mode**: Cache data for offline usage
- [ ] **User Accounts**: Save favorite routes and preferences
- [ ] **Social Features**: Share recommendations with friends

### Technical Improvements
- [ ] **Real-time Updates**: WebSocket integration for live flight tracking
- [ ] **Advanced 3D**: More detailed airplane models and cockpit interiors
- [ ] **Performance Optimization**: Lazy loading and code splitting
- [ ] **Accessibility**: WCAG compliance and screen reader support
- [ ] **Internationalization**: Multi-language support
- [ ] **Progressive Web App**: PWA features for mobile users

### Data Enhancements
- [ ] **Historical Data**: Past flight data for better predictions
- [ ] **Seasonal Patterns**: Account for seasonal sun position changes
- [ ] **Altitude Considerations**: Factor in flight altitude for better accuracy
- [ ] **Time Zone Handling**: Proper timezone calculations for international flights





## 🙏 Acknowledgments

- **SunCalc**: For precise astronomical calculations
- **Leaflet.js**: For interactive 2D mapping
- **Three.js**: For immersive 3D experiences
- **OpenStreetMap**: For map tiles and data
- **React Community**: For excellent documentation and tools

---

**Happy flying! ✈️🌅**

*Find the perfect flight seat for next level experience.* 

Developed and designed by Prateek Khandelwal