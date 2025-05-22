const PlaceDetails = ({ placeDetails, showDetails, expandedCard, toggleCard, handleDirectionsClick, isCalculatingRoute, showRouteInfo }) => {
    if (!placeDetails || !showDetails) return null;
  
    return (
      <div className={`place-details-box ${expandedCard === 'place' ? 'expanded' : 'collapsed'}`}>
        <div className="card-header" onClick={() => toggleCard('place')}>
          <span>Lieu</span>
          <span className="toggle-icon">
            {expandedCard === 'place' ? '◄' : '►'}
          </span>
        </div>
        <div className="card-content">
          <h3>{placeDetails.name}</h3>
          <p>
            {placeDetails.type} - {placeDetails.city}
          </p>
          <p>Lat: {placeDetails.lat}</p>
          <p>Lon: {placeDetails.lon}</p>
          <div className="buttons">
            <button
              className="itinerary-btn"
              onClick={handleDirectionsClick}
              disabled={isCalculatingRoute}
            >
              {isCalculatingRoute ? 'Calcul en cours...' : showRouteInfo ? 'Masquer' : 'Itinéraire'}
            </button>
            <button className="favorite-btn">Favoris</button>
            <button className="share-btn">Partager</button>
          </div>
        </div>
      </div>
    );
  };
  
  export default PlaceDetails;
