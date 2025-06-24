"use client"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { placeIcons } from '../utils/iconUtils';
import { haversineDistance, formatDistance, estimateTime, formatTime } from '../utils/routeUtils';
import { faMapPin } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';

const SearchBar = ({ searchQuery, handleSearchChange, suggestions, handleSelectSuggestion, currentLocation, handlePlacePin, hasSelectedDestination }) => {
  // L'option de pin s'affiche toujours sauf quand une destination est sélectionnée
  const showPinOption = !hasSelectedDestination;

  return (
    <div className="search-bar">
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Rechercher un lieu..."
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && suggestions.length > 0) {
              handleSelectSuggestion(suggestions[0]);
            }
          }}
        />
      </div>
      {(suggestions.length > 0 || searchQuery) && (
        <ul className="suggestions-dropdown">
          {showPinOption && (
            <li 
              className="pin-option"
              onClick={handlePlacePin}
            >
              <FontAwesomeIcon icon={faMapPin} className="suggestion-icon" />
              <div className="suggestion-content">
                <div className="place-name">Placer un pin sur la carte</div>
                <div className="place-details">Cliquez pour placer votre destination manuellement</div>
              </div>
            </li>
          )}
          {suggestions.map((suggestion, index) => {
            const distance =
              currentLocation && suggestion.lat && suggestion.lon
                ? haversineDistance(currentLocation, [suggestion.lat, suggestion.lon])
                : null;
            const time = distance ? estimateTime(distance) : null;
            const icon = placeIcons[suggestion.type.toLowerCase()] || placeIcons.default;

            return (
              <li
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <FontAwesomeIcon icon={icon} className="suggestion-icon" />
                <div className="suggestion-content">
                  <div className="place-name">{suggestion.name}</div>
                  <div className="place-details">
                    {suggestion.type}, {suggestion.city}
                  </div>
                </div>
                {distance && (
                  <div className="suggestion-distance">
                    {formatDistance(distance)} ({formatTime(time)})
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
