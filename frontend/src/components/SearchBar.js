import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { placeIcons } from '../utils/iconUtils';
import { haversineDistance, formatDistance, estimateTime, formatTime } from '../utils/routeUtils';

const SearchBar = ({ searchQuery, handleSearchChange, suggestions, handleSelectSuggestion, currentLocation }) => {
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
      {suggestions.length > 0 && (
        <ul className="suggestions-dropdown">
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
