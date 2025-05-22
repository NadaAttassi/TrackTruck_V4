import { useState, useCallback } from 'react';

const useRiskAnalysis = () => {
  const [riskAnalysis, setRiskAnalysis] = useState([]);
  const [safePathIndex, setSafePathIndex] = useState(null);

  const fetchRiskAnalysis = useCallback(async (routesToAnalyze, zonesToAnalyze, setError, setSelectedRouteIndex, setRouteGeometry, setRouteInstructions, setRemainingDistance, setRemainingTime, setShowInstructions) => {
    try {
      console.log('Analyse des risques pour les itinéraires...');
      console.log('Nombre de routes:', routesToAnalyze.length);
      console.log('Nombre de zones:', zonesToAnalyze.length);

      if (!routesToAnalyze || routesToAnalyze.length === 0) {
        throw new Error('Aucune route à analyser pour le risque.');
      }

      const sampledRoutes = routesToAnalyze.map(route => {
        const geometry = route.geometry || [];
        const sampledGeometry = geometry.filter((_, index) => index % 10 === 0);
        console.log(`Itinéraire ${routesToAnalyze.indexOf(route) + 1} - Points originaux: ${geometry.length}, Points échantillonnés: ${sampledGeometry.length}`);
        console.log(`Itinéraire ${routesToAnalyze.indexOf(route) + 1} - Points échantillonnés:`, sampledGeometry);
        return {
          geometry: sampledGeometry,
        };
      });

      const payload = JSON.stringify({
        routes: sampledRoutes,
        zones: zonesToAnalyze,
      });
      const payloadSizeInBytes = new TextEncoder().encode(payload).length;
      console.log('Taille du payload (en Mo) :', payloadSizeInBytes / (1024 * 1024));

      const response = await fetch('http://localhost:3001/api/risk/analyze-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status} - ${await response.text()}`);
      const data = await response.json();
      console.log('Réponse complète de l\'API analyze-risk:', data); // Log pour déboguer

      if (data.success) {
        console.log('Analyse des risques reçue:', data.analysis);
        if (!data.analysis || data.analysis.length === 0) {
          console.warn('Aucune donnée d\'analyse de risque renvoyée par l\'API.');
          setRiskAnalysis([]);
          setSafePathIndex(null);
          setError('Aucune donnée d\'analyse de risque disponible.');
          return;
        }

        setRiskAnalysis(data.analysis);

        if (data.analysis.length !== routesToAnalyze.length) {
          console.error(
            `Mismatch between analysis length (${data.analysis.length}) and routesToAnalyze length (${routesToAnalyze.length})`
          );
          throw new Error('Le nombre d\'analyses de risque ne correspond pas au nombre de routes.');
        }

        const distanceWeight = 0.1;
        const turnWeight = 2;

        const maxDistance = Math.max(...routesToAnalyze.map(route => route.distance || 0));

        let bestRoute = null;
        let minScore = Infinity;

        const routeScores = data.analysis.map((analysis, idx) => {
          if (!routesToAnalyze[idx]) {
            console.error(`Route at index ${idx} is undefined in routesToAnalyze`);
            return null;
          }

          const riskCounts = analysis.riskCounts;
          const highRiskPoints = riskCounts['élevé'] || 0;
          const mediumRiskPoints = riskCounts['moyen'] || 0;
          const lowRiskPoints = riskCounts['faible'] || 0;
          const unknownRiskPoints = riskCounts['inconnu'] || 0;

          const riskScore = (highRiskPoints * 10) + (mediumRiskPoints * 3) - (lowRiskPoints * 1);

          const routeDistance = routesToAnalyze[idx].distance || 0;
          const normalizedDistance = maxDistance > 0 ? routeDistance / maxDistance : 0;

          const instructions = routesToAnalyze[idx].instructions || [];
          const numberOfTurns = instructions.filter(instr =>
            instr.text.includes('Tourner à droite') || instr.text.includes('Tourner à gauche')
          ).length;

          const totalScore =
            riskScore +
            (normalizedDistance * distanceWeight) +
            (numberOfTurns * turnWeight);

          console.log(`Itinéraire ${idx + 1} - Détails:`);
          console.log(`  Points à risque - Élevés: ${highRiskPoints}, Moyens: ${mediumRiskPoints}, Faibles: ${lowRiskPoints}, Inconnus: ${unknownRiskPoints}`);
          console.log(`  Score de risque: ${riskScore}`);
          console.log(`  Distance normalisée: ${normalizedDistance}`);
          console.log(`  Nombre de virages: ${numberOfTurns}`);
          console.log(`  Score total: ${totalScore}`);

          return {
            index: idx,
            totalScore,
            riskScore,
            highRiskPoints,
            mediumRiskPoints,
            lowRiskPoints,
            distance: routeDistance,
            turns: numberOfTurns,
          };
        }).filter(score => score !== null);

        routeScores.forEach(score => {
          if (score.totalScore < minScore) {
            minScore = score.totalScore;
            bestRoute = score;
          } else if (score.totalScore === minScore) {
            if (score.riskScore < bestRoute.riskScore) {
              bestRoute = score;
            } else if (score.riskScore === bestRoute.riskScore) {
              if (score.highRiskPoints < bestRoute.highRiskPoints) {
                bestRoute = score;
              } else if (score.highRiskPoints === bestRoute.highRiskPoints) {
                if (score.mediumRiskPoints < bestRoute.mediumRiskPoints) {
                  bestRoute = score;
                } else if (score.mediumRiskPoints === bestRoute.mediumRiskPoints) {
                  if (score.lowRiskPoints > bestRoute.lowRiskPoints) {
                    bestRoute = score;
                  } else if (score.lowRiskPoints === bestRoute.lowRiskPoints) {
                    if (score.distance < bestRoute.distance) {
                      bestRoute = score;
                    }
                  }
                }
              }
            }
          }
        });

        const safePathIdx = bestRoute ? bestRoute.index : 0;
        console.log(`Safe Path déterminé: Itinéraire ${safePathIdx + 1} avec un score de ${minScore}`);
        setSafePathIndex(safePathIdx);

        setSelectedRouteIndex(safePathIdx);
        const selectedRoute = routesToAnalyze[safePathIdx];
        setRouteGeometry(selectedRoute.geometry);
        setRouteInstructions(selectedRoute.instructions);
        setRemainingDistance(selectedRoute.distance);
        setRemainingTime(selectedRoute.duration);
        setShowInstructions(false);
      } else {
        throw new Error(data.message || 'Erreur lors de l\'analyse des risques');
      }
    } catch (err) {
      console.error('Erreur fetchRiskAnalysis:', err);
      setRiskAnalysis([]);
      setSafePathIndex(null);
      setError('Erreur lors de l\'analyse des risques : ' + err.message);
    }
  }, []);

  return { riskAnalysis, setRiskAnalysis, safePathIndex, setSafePathIndex, fetchRiskAnalysis };
};

export default useRiskAnalysis;
