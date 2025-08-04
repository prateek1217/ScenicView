import { Request, Response } from 'express';
import { calculateFlightPath } from '../services/flightPathService';
import { calculateSunPositions } from '../services/sunPositionService';
import { getSeatRecommendation } from '../services/seatRecommendationService';
import { analyzeFlightSunConditions } from '../services/enhancedSunAnalysisService';

export const routeHandler = async (req: Request, res: Response) => {
  try {
    const { from, to, depart, duration } = req.query;

    // Validate required parameters
    if (!from || !to || !depart) {
      return res.status(400).json({
        error: 'Missing required parameters: from, to, depart'
      });
    }

    const fromAirport = from as string;
    const toAirport = to as string;
    const departureTime = new Date(depart as string);
    const flightDuration = duration ? parseFloat(duration as string) : undefined;

    // Validate date
    if (isNaN(departureTime.getTime())) {
      return res.status(400).json({
        error: 'Invalid departure time format. Use ISO 8601 format (e.g., 2025-08-01T18:00)'
      });
    }

    // Calculate flight path
    const flightPath = calculateFlightPath(fromAirport, toAirport, departureTime);
    
    // Calculate sun positions along the path
    const sunPositions = calculateSunPositions(flightPath, departureTime);
    
    // Get seat recommendation (considering flight direction)
    const recommendation = getSeatRecommendation(sunPositions, flightPath);

    // Enhanced sun analysis (if duration is provided)
    let enhancedAnalysis = null;
    if (flightDuration) {
      try {
        // Extract date and time components for the enhanced analysis
        const departureDate = departureTime.toISOString().split('T')[0];
        const departureTimeStr = departureTime.toISOString().split('T')[1].substring(0, 5);
        
        enhancedAnalysis = analyzeFlightSunConditions(
          fromAirport,
          toAirport,
          departureDate,
          departureTimeStr,
          flightDuration
        );
        
        console.log('Enhanced sun analysis completed:', enhancedAnalysis.summary);
      } catch (analysisError) {
        console.warn('Enhanced analysis failed, continuing with basic analysis:', analysisError);
      }
    }

    res.json({
      path: flightPath,
      sunPositions,
      recommendation,
      enhancedAnalysis: enhancedAnalysis || {
        willSeeSunrise: false,
        willSeeSunset: false,
        willSeeNight: false,
        willSeeGoldenHour: false,
        summary: ['Flight analysis requires duration parameter'],
        recommendations: [],
        seatSuggestion: 'either',
        timeline: []
      }
    });

  } catch (error) {
    console.error('Error processing route request:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 