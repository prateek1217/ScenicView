import React, { useState } from 'react';

// Seat positions mapping (for display purposes)
const SEAT_POSITIONS: { [key: string]: { row: number, side: string } } = {
  'A1': { row: 1, side: 'Left' },
  'B1': { row: 1, side: 'Left' },
  'C1': { row: 1, side: 'Right' },
  'D1': { row: 1, side: 'Right' },
  'A2': { row: 2, side: 'Left' },
  'B2': { row: 2, side: 'Left' },
  'C2': { row: 2, side: 'Right' },
  'D2': { row: 2, side: 'Right' },
  'A3': { row: 3, side: 'Left' },
  'B3': { row: 3, side: 'Left' },
  'C3': { row: 3, side: 'Right' },
  'D3': { row: 3, side: 'Right' },
  'A4': { row: 4, side: 'Left' },
  'B4': { row: 4, side: 'Left' },
  'C4': { row: 4, side: 'Right' },
  'D4': { row: 4, side: 'Right' },
  'A5': { row: 5, side: 'Left' },
  'B5': { row: 5, side: 'Left' },
  'C5': { row: 5, side: 'Right' },
  'D5': { row: 5, side: 'Right' },
};

interface AirplaneExperienceProps {
  selectedSeat?: string;
  onSeatChange?: (seat: string) => void;
}

const AirplaneExperience: React.FC<AirplaneExperienceProps> = ({ selectedSeat, onSeatChange }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSeatSelection = (seat: string) => {
    if (onSeatChange) {
      onSeatChange(seat);
    }
  };

  const renderAirplaneCabin = () => {
    const rows = [1, 2, 3, 4, 5];
    const leftSeats = ['A', 'B'];
    const rightSeats = ['C', 'D'];
    
    return (
      <div style={{
        background: 'linear-gradient(180deg, #f0f8ff 0%, #e6f3ff 100%)',
        borderRadius: '50px 50px 20px 20px',
        padding: '40px 20px',
        maxWidth: '600px',
        margin: '0 auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        border: '3px solid #ccc'
      }}>
        {/* Cockpit */}
        <div style={{
          background: 'linear-gradient(135deg, #2c3e50, #34495e)',
          height: '80px',
          borderRadius: '50px 50px 10px 10px',
          margin: '0 auto 30px auto',
          width: '80%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          ✈️ Cockpit
        </div>

        {/* Cabin Rows */}
        {rows.map(row => (
          <div key={row} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '15px 0',
            padding: '0 20px'
          }}>
            {/* Left Side Seats */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {leftSeats.map(letter => {
                const seatId = `${letter}${row}`;
                const isSelected = selectedSeat === seatId;
                return (
                  <button
                    key={seatId}
                    onClick={() => handleSeatSelection(seatId)}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '10px',
                      border: isSelected ? '3px solid #3498db' : '2px solid #bdc3c7',
                      background: isSelected 
                        ? 'linear-gradient(135deg, #3498db, #2980b9)' 
                        : 'linear-gradient(135deg, #1e3a8a, #1e40af)',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {seatId}
                  </button>
                );
              })}
            </div>

            {/* Aisle */}
            <div style={{
              width: '80px',
              height: '3px',
              background: 'linear-gradient(90deg, #ecf0f1, #bdc3c7, #ecf0f1)',
              borderRadius: '2px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '10px',
                color: '#7f8c8d',
                fontWeight: 'bold'
              }}>
                Row {row}
              </div>
            </div>

            {/* Right Side Seats */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {rightSeats.map(letter => {
                const seatId = `${letter}${row}`;
                const isSelected = selectedSeat === seatId;
                return (
                  <button
                    key={seatId}
                    onClick={() => handleSeatSelection(seatId)}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '10px',
                      border: isSelected ? '3px solid #3498db' : '2px solid #bdc3c7',
                      background: isSelected 
                        ? 'linear-gradient(135deg, #3498db, #2980b9)' 
                        : 'linear-gradient(135deg, #1e3a8a, #1e40af)',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {seatId}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Rear */}
        <div style={{
          background: 'linear-gradient(135deg, #34495e, #2c3e50)',
          height: '50px',
          borderRadius: '10px 10px 30px 30px',
          margin: '30px auto 0 auto',
          width: '90%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          🚽 Lavatory & Galley
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      position: 'relative',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>🛩️ Airplane Seat Experience</h1>
        <p style={{ margin: '0', fontSize: '16px', opacity: 0.9 }}>
          Click on any seat to select your preferred position
        </p>
      </div>

      {/* Seat selection info */}
      {selectedSeat && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 100,
          minWidth: '200px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🪑 Selected Seat</h3>
          <div style={{
            padding: '15px',
            background: '#e8f5e8',
            borderRadius: '8px',
            color: '#2c5530'
          }}>
            <div><strong>Seat:</strong> {selectedSeat}</div>
            <div><strong>Row:</strong> {SEAT_POSITIONS[selectedSeat]?.row}</div>
            <div><strong>Side:</strong> {SEAT_POSITIONS[selectedSeat]?.side}</div>
          </div>
        </div>
      )}

      {/* Airplane Cabin */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 140px)',
        padding: '20px'
      }}>
        {renderAirplaneCabin()}
      </div>

      {/* Instructions */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <div><strong>🎮 Instructions:</strong></div>
        <div>• Click any seat to select it</div>
        <div>• Blue seats are premium (A, B)</div>
        <div>• Red seats are standard (C, D)</div>
        <div>• Interactive seat visualization</div>
      </div>
    </div>
  );
};

export default AirplaneExperience;