import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import OpenStreetMapPage from './pages/OpenStreetMapPage';
import DriverLoginPage from './pages/DriverLoginPage';
import './assets/TruckAnimation.css';
import logo from './assets/logo.png';
import truckImage from './assets/trucks.png';

function App() {
  const [animationStage, setAnimationStage] = useState('doors-closed');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Only run animation if not logged in
    if (!isLoggedIn) {
      const timeline = [
        { stage: 'truck-passing', delay: 300 },
        { stage: 'doors-open', delay: 2300 }
      ];

      const timers = timeline.map(({ stage, delay }) => 
        setTimeout(() => setAnimationStage(stage), delay)
      );

      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [isLoggedIn]); // Add isLoggedIn as dependency

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAnimationStage('doors-closed'); // Reset animation state
  };

  return (
    <Router>
      <div className={`app-container ${animationStage}`}>
        {/* Animation elements */}
        {!isLoggedIn && (
          <>
            <div className="left-door"></div>
            <div className="right-door"></div>
            
            {animationStage === 'truck-passing' && (
              <div className="truck-animation">
                <div className="truck">
                  <img src={truckImage} alt="Truck" style={{ height: '80px' }} />
                </div>
                <div className="road"></div>
              </div>
            )}
          </>
        )}

        {/* Main content */}
        {isLoggedIn ? (
          <OpenStreetMapPage onLogout={handleLogout} />
        ) : (
          animationStage === 'doors-open' && <DriverLoginPage onLogin={handleLogin} logo={logo} />
        )}
      </div>
    </Router>
  );
}

export default App;
