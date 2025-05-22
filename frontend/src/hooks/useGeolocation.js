import { useState, useEffect, useCallback, useRef } from 'react';

const useGeolocation = (setError) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const watchIdRef = useRef(null);

  const safeSetError = useCallback(
    (message) => {
      if (typeof setError === 'function') {
        setError(message);
      } else {
        console.error('setError is not a function:', setError);
      }
    },
    [setError]
  );

  const getCurrentLocation = useCallback(() => {
    console.log('Démarrage de la récupération de la position...');
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`Position trouvée - Lat: ${latitude}, Lon: ${longitude}, Précision: ${accuracy}m`);
          setCurrentLocation([latitude, longitude]);
          safeSetError(null);
          setIsLoadingLocation(false);
        },
        (err) => {
          console.error('Erreur géolocalisation:', err.message);
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude, accuracy } = position.coords;
              console.log(`Position trouvée (précision standard) - Lat: ${latitude}, Lon: ${longitude}, Précision: ${accuracy}m`);
              setCurrentLocation([latitude, longitude]);
              safeSetError(null);
              setIsLoadingLocation(false);
            },
            (err) => {
              console.error('Erreur géolocalisation (précision standard):', err.message);
              safeSetError('Impossible d\'obtenir la position. Veuillez entrer manuellement ou vérifier les permissions de géolocalisation.');
              setIsLoadingLocation(false);
            },
            { enableHighAccuracy: false, timeout: 30000, maximumAge: 0 }
          );
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      );
    } else {
      safeSetError('Géolocalisation non supportée par votre navigateur.');
      setIsLoadingLocation(false);
    }
  }, [safeSetError]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  useEffect(() => {
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`Position mise à jour - Lat: ${latitude}, Lon: ${longitude}, Précision: ${accuracy}m`);
          setCurrentLocation([latitude, longitude]);
          safeSetError(null);
        },
        (err) => {
          console.error('Erreur suivi position:', err.message);
          safeSetError('Erreur lors du suivi de la position : ' + err.message);
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0, distanceFilter: 10 }
      );
    }
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [safeSetError]);

  return { currentLocation, setCurrentLocation, getCurrentLocation, isLoadingLocation };
};

export default useGeolocation;
