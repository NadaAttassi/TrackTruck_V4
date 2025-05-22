import { formatDistance, formatTime } from '../utils/routeUtils';
import { getRouteButtonClass } from '../utils/riskUtils';

const RouteInfo = ({
  showRouteInfo,
  routes,
  remainingDistance,
  remainingTime, // Ajout de remainingTime dans les props
  expandedCard,
  toggleCard,
  riskAnalysis,
  selectedRouteIndex,
  safePathIndex,
  error,
  setSelectedRouteIndex,
  setRouteGeometry,
  setRouteInstructions,
  setRemainingDistance,
  setRemainingTime,
  setShowInstructions,
  showInstructions,
  routeInstructions,
}) => {
  if (!showRouteInfo || routes.length === 0 || remainingDistance <= 0) return null;

  return (
    <div className={`route-info-box ${expandedCard === 'route' ? 'expanded' : 'collapsed'}`}>
      <div className="card-header" onClick={() => toggleCard('route')}>
        <span>Itinéraire</span>
        <span className="toggle-icon">
          {expandedCard === 'route' ? '◄' : '►'}
        </span>
      </div>
      <div className="card-content">
        <div className="route-summary">
          Distance: {formatDistance(remainingDistance)} | Temps: {formatTime(remainingTime)}
          <br />
          {riskAnalysis.length > 0 && riskAnalysis[selectedRouteIndex] ? (
            <div className="risk-stats">
              Points à risque (Total: {riskAnalysis[selectedRouteIndex].totalPoints}) :<br />
              Élevés: {riskAnalysis[selectedRouteIndex].riskCounts['élevé'] || 0}<br />
              Moyens: {riskAnalysis[selectedRouteIndex].riskCounts['moyen'] || 0}<br />
              Faibles: {riskAnalysis[selectedRouteIndex].riskCounts['faible'] || 0}<br />
              Inconnus: {riskAnalysis[selectedRouteIndex].riskCounts['inconnu'] || 0}<br />
              {safePathIndex === selectedRouteIndex && (
                <span className="safe-path-label">Safe Path</span>
              )}
            </div>
          ) : (
            <div className="risk-stats">
              {error ? `Erreur : ${error}` : 'Aucune donnée de risque disponible.'}
            </div>
          )}
        </div>
        <div className="tab-buttons">
          {routes.map((_, index) => (
            <button
              key={index}
              className={`route-btn ${getRouteButtonClass(index, riskAnalysis, safePathIndex)} ${
                selectedRouteIndex === index ? 'active' : ''
              }`}
              onClick={() => {
                setSelectedRouteIndex(index);
                const selectedRoute = routes[index];
                setRouteGeometry(selectedRoute.geometry);
                setRouteInstructions(selectedRoute.instructions);
                setRemainingDistance(selectedRoute.distance);
                setRemainingTime(selectedRoute.duration);
                setShowInstructions(false);
              }}
            >
              Itinéraire {index + 1}
            </button>
          ))}
        </div>
        <div className="tab-content">
          {showInstructions && routeInstructions.length > 0 && (
            <div className="route-instructions">
              {routeInstructions.map((instruction, index) => (
                <div key={index} className="instruction-item">
                  <span>{instruction.text}</span>
                  {instruction.distance > 0 && (
                    <span> - {formatDistance(instruction.distance)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="buttons">
            <button className="info-btn">Informations</button>
            <button
              className="details-btn"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {showInstructions ? 'Masquer les détails' : 'Détails complets'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteInfo;
