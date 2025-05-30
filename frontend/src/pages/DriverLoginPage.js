import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/TruckAnimation.css'; // Corrected import path
import logo from '../assets/logo.png';

const DriverLoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    matricule: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/drivers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('driverToken', data.token);
        onLogin(); // Use the passed callback
        navigate('/');
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={logo} alt="TrackTruck Logo" className="logo" />
          <h1>Connexion Conducteur</h1>
          <p>Entrez vos identifiants</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Matricule</label>
            <input
              type="text"
              placeholder="Matricule"
              value={formData.matricule}
              onChange={(e) => setFormData({...formData, matricule: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          
          <div className="form-options">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Se souvenir de moi</label>
            </div>
          </div>
          
          <button type="submit" className="submit-btn">
            Se connecter
          </button>
          
          <div className="password-help">
            <p>Mot de passe oublié ? Contactez votre administrateur</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverLoginPage;
