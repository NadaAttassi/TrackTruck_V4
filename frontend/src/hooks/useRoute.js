import { useCallback } from 'react';
import api from '../utils/api';

const useRoute = (fetchRiskAnalysis, zones, setError) => {
  const fetchRouteFromServer = useCallback(
    async (
      startPoint,
      endPoint,
      setRoutes,
      setRouteInstructions,
      setRouteGeometry,
      setRemainingDistance,
      setRemainingTime,
      setError,
      setLoading,
      setSelectedRouteIndex,
      setShowInstructions
    ) => {
      if (
        !startPoint ||
        !Array.isArray(startPoint) ||
        startPoint.length !== 2 ||
        isNaN(startPoint[0]) ||
        isNaN(startPoint[1])
      ) {
        setError('Position de départ non valide. Veuillez activer la géolocalisation ou entrer une position manuellement.');
        setLoading(false);
        return;
      }
      if (
        !endPoint ||
        !Array.isArray(endPoint) ||
        endPoint.length !== 2 ||
        isNaN(endPoint[0]) ||
        isNaN(endPoint[1])
      ) {
        setError('Position d\'arrivée non valide. Veuillez sélectionner une destination.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('Envoi requête itinéraire - Départ:', startPoint, 'Arrivée:', endPoint);
        const response = await api.post('/api/route', {
          startLat: startPoint[0],
          startLon: startPoint[1],
          endLat: endPoint[0],
          endLon: endPoint[1],
          alternatives: 10,
        });
        const data = response.data;
        console.log('Itinéraires reçus:', data);

        let routes = [];
        if (Array.isArray(data)) {
          routes = data;
        } else if (data.success && data.routes && Array.isArray(data.routes)) {
          routes = data.routes;
        } else {
          const errorMessage = data.message || 'Aucun itinéraire trouvé entre ces points. Vérifiez les coordonnées ou essayez une autre destination.';
          throw new Error(errorMessage);
        }

        if (routes.length > 0) {
          const processedRoutes = routes.map((route) => ({
            geometry: route.geometry,
            instructions: route.instructions,
            distance: route.distance,
            duration: route.duration,
          }));
          setRoutes(processedRoutes);

          if (zones.length > 0) {
            console.log('Analyse des risques en cours pour les nouveaux itinéraires...');
            await fetchRiskAnalysis(
              processedRoutes,
              zones,
              setError,
              setSelectedRouteIndex,
              setRouteGeometry,
              setRouteInstructions,
              setRemainingDistance,
              setRemainingTime,
              setShowInstructions
            );
            console.log('Analyse des risques terminée.');
          } else {
            console.warn('Aucune zone disponible pour l\'analyse des risques.');
            setError('Aucune zone de risque disponible. L\'itinéraire est affiché sans analyse de risque.');
            const defaultRiskAnalysis = processedRoutes.map(() => ({
              totalPoints: 0,
              riskCounts: {
                élevé: 0,
                moyen: 0,
                faible: 0,
                inconnu: 0,
              },
            }));
            setSelectedRouteIndex(0);
            const selectedRoute = processedRoutes[0];
            setRouteGeometry(selectedRoute.geometry);
            setRouteInstructions(selectedRoute.instructions);
            setRemainingDistance(selectedRoute.distance);
            setRemainingTime(selectedRoute.duration);
            console.log('Analyse des risques par défaut en cours...');
            fetchRiskAnalysis(
              processedRoutes,
              [],
              setError,
              setSelectedRouteIndex,
              setRouteGeometry,
              setRouteInstructions,
              setRemainingDistance,
              setRemainingTime,
              setShowInstructions
            );
            console.log('Analyse des risques par défaut terminée.');
          }
        } else {
          throw new Error('Aucun itinéraire trouvé dans la réponse du serveur.');
        }
      } catch (err) {
        console.error('Erreur fetchRouteFromServer:', err);
        if (err.message.includes('429')) {
          setError('Trop de requêtes pour calculer l\'itinéraire. Veuillez réessayer dans quelques instants.');
        } else {
          setError('Impossible de calculer l\'itinéraire : ' + err.message);
        }
        setRoutes([]);
        setRouteGeometry([]);
        setRouteInstructions([]);
        setRemainingDistance(null);
        setRemainingTime(null);
      } finally {
        setLoading(false);
      }
    },
    [zones, fetchRiskAnalysis, setError]
  );

  return { fetchRouteFromServer };
};

export default useRoute;
