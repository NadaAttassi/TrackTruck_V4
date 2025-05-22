"use client"

import { useState, useCallback, useEffect } from "react"
import { debounce } from "lodash"
import ErrorBoundary from "../components/ErrorBoundary"
import MapComponent from "../components/MapComponent"
import SearchBar from "../components/SearchBar"
import PlaceDetails from "../components/PlaceDetails"
import RouteInfo from "../components/RouteInfo"
import ManualLocationForm from "../components/ManualLocationForm"
import useSpeechQueue from "../hooks/useSpeechQueue"
import useGeolocation from "../hooks/useGeolocation"
import useSuggestions from "../hooks/useSuggestions"
import useRiskAnalysis from "../hooks/useRiskAnalysis"
import useRoute from "../hooks/useRoute"
import useZones from "../hooks/useZones"
import useMonitoring from "../hooks/useMonitoring"
import useDeviceOrientation from "../hooks/useDeviceOrientation"
import useZoneAlerts from "../hooks/useZoneAlerts"
import { checkProximity } from "../utils/proximityUtils"
import "./OpenStreetMapPage.css"
import isPointInPolygon from "../utils/isPointInPolygon"

const OpenStreetMapPage = () => {
  // États principaux (non liés au monitoring)
  const [error, setError] = useState(null)
  const { currentLocation, setCurrentLocation, getCurrentLocation, isLoadingLocation } = useGeolocation(setError)
  const { searchQuery, setSearchQuery, suggestions, setSuggestions, fetchSuggestions } = useSuggestions(setError)
  const { queueSpeech, isSpeaking } = useSpeechQueue()
  const { riskAnalysis, setRiskAnalysis, safePathIndex, setSafePathIndex, fetchRiskAnalysis } = useRiskAnalysis()
  const { zones, setZones, showZones, setShowZones, fetchZones, handleShowZonesClick } = useZones(setError)
  const { fetchRouteFromServer } = useRoute(fetchRiskAnalysis, zones, setError)
  const { heading, speed } = useDeviceOrientation()

  const [positionArrivee, setPositionArrivee] = useState(null)
  const [routes, setRoutes] = useState([])
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [routeInstructions, setRouteInstructions] = useState([])
  const [routeGeometry, setRouteGeometry] = useState([])
  const [remainingDistance, setRemainingDistance] = useState(0)
  const [remainingTime, setRemainingTime] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [manualLocation, setManualLocation] = useState({ lat: "", lon: "" })
  const [placeDetails, setPlaceDetails] = useState(null)
  const [showDetails, setShowDetails] = useState(true)
  const [showRouteInfo, setShowRouteInfo] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [expandedCard, setExpandedCard] = useState("none")
  const [routeRiskZones, setRouteRiskZones] = useState([])
  const [traveledPath, setTraveledPath] = useState([]) // Nouveau state pour le chemin parcouru

  // Utilisation du Hook useMonitoring
  const { isMonitoring, deviationMessage, startMonitoring, stopMonitoring } = useMonitoring(
    currentLocation,
    positionArrivee,
    routes,
    selectedRouteIndex,
    fetchRouteFromServer,
    setRoutes,
    setRouteInstructions,
    setRouteGeometry,
    setRemainingDistance,
    setRemainingTime,
    setError,
    setLoading,
    setSelectedRouteIndex,
    setShowInstructions,
    setShowRouteInfo,
    queueSpeech,
  )

  // Fonction pour calculer le point le plus proche sur l'itinéraire
  const findClosestPointOnRoute = useCallback(() => {
    if (!currentLocation || !routeGeometry || routeGeometry.length === 0 || !isMonitoring) return null

    let closestPoint = null
    let minDistance = Number.POSITIVE_INFINITY
    let closestIndex = 0

    // Fonction pour calculer la distance entre deux points (Haversine)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3 // Rayon de la Terre en mètres
      const φ1 = (lat1 * Math.PI) / 180
      const φ2 = (lat2 * Math.PI) / 180
      const Δφ = ((lat2 - lat1) * Math.PI) / 180
      const Δλ = ((lon2 - lon1) * Math.PI) / 180

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    // Trouver le point le plus proche
    for (let i = 0; i < routeGeometry.length; i++) {
      const point = routeGeometry[i]
      const distance = calculateDistance(currentLocation[0], currentLocation[1], point[0], point[1])

      if (distance < minDistance) {
        minDistance = distance
        closestPoint = point
        closestIndex = i
      }
    }

    // Mettre à jour le chemin parcouru
    if (closestIndex >= 0) {
      const newTraveledPath = routeGeometry.slice(0, closestIndex + 1)
      setTraveledPath(newTraveledPath)
    }

    return { point: closestPoint, index: closestIndex }
  }, [currentLocation, routeGeometry, isMonitoring])

  // Mettre à jour le chemin parcouru lorsque la position change
  useEffect(() => {
    if (isMonitoring) {
      findClosestPointOnRoute()
    }
  }, [currentLocation, isMonitoring, findClosestPointOnRoute])

  // Réinitialiser le chemin parcouru lorsque le monitoring s'arrête
  useEffect(() => {
    if (!isMonitoring) {
      setTraveledPath([])
    }
  }, [isMonitoring])

  // Puis, ajoutez cette fonction après la déclaration des hooks:
  const checkRouteRiskZones = useCallback(() => {
    if (!routeGeometry || !zones || !isMonitoring) return

    // Vérifier si le trajet traverse des zones à risque
    const riskZones = zones.filter((zone) => {
      const normalizedRisk = zone.risk?.toLowerCase() || "inconnu"
      if (normalizedRisk !== "élevé" && normalizedRisk !== "moyen") return false

      // Vérifier si au moins un point du trajet est dans cette zone
      return routeGeometry.some((point) => {
        return isPointInPolygon({ lat: point[0], lon: point[1] }, zone.geometry)
      })
    })

    setRouteRiskZones(riskZones)

    // Alerter l'utilisateur si le trajet traverse des zones à risque
    if (riskZones.length > 0 && isMonitoring) {
      const highRiskCount = riskZones.filter((z) => z.risk?.toLowerCase() === "élevé").length
      const mediumRiskCount = riskZones.filter((z) => z.risk?.toLowerCase() === "moyen").length

      let message = "Attention! Votre itinéraire traverse "
      if (highRiskCount > 0) {
        message += `${highRiskCount} zone${highRiskCount > 1 ? "s" : ""} à risque élevé`
        if (mediumRiskCount > 0) message += " et "
      }
      if (mediumRiskCount > 0) {
        message += `${mediumRiskCount} zone${mediumRiskCount > 1 ? "s" : ""} à risque moyen`
      }

      queueSpeech(message)
    }
  }, [routeGeometry, zones, isMonitoring, queueSpeech])

  // Ajoutez un useEffect pour vérifier les zones à risque lorsque l'itinéraire change
  useEffect(() => {
    checkRouteRiskZones()
  }, [routeGeometry, isMonitoring, checkRouteRiskZones])

  // Utilisation du Hook pour les alertes de zones
  const { showAlert, alertMessage, currentZone } = useZoneAlerts(currentLocation, zones, queueSpeech, isMonitoring)

  const mapCenter = positionArrivee || currentLocation || [33.5731, -7.5898]

  const toggleCard = (card) => {
    setExpandedCard((prev) => (prev === card ? "none" : card))
  }

  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), [fetchSuggestions])

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    debouncedFetchSuggestions(query)
  }

  const handleSelectSuggestion = useCallback(
    async (suggestion) => {
      const lat = Number.parseFloat(suggestion.lat)
      const lon = Number.parseFloat(suggestion.lon)
      if (isNaN(lat) || isNaN(lon)) {
        setError("Coordonnées de la destination invalides. Veuillez sélectionner une autre destination.")
        return
      }
      const newPosition = [lat, lon]
      setPositionArrivee(newPosition)
      setPlaceDetails({
        name: suggestion.name,
        type: suggestion.type || "Lieu",
        city: suggestion.city || "Ville inconnue",
        lat: suggestion.lat,
        lon: suggestion.lon,
      })
      setShowDetails(true)
      setSearchQuery(`${suggestion.name}, ${suggestion.city}`)
      setSuggestions([])
      console.log("PositionArrivee définie:", newPosition)
      setError(null)

      if (
        currentLocation &&
        Array.isArray(currentLocation) &&
        currentLocation.length === 2 &&
        !isNaN(currentLocation[0]) &&
        !isNaN(currentLocation[1])
      ) {
        console.log("Coordonnées avant fetchRouteFromServer - Départ:", currentLocation, "Arrivée:", newPosition)
        await fetchRouteFromServer(
          currentLocation,
          newPosition,
          setRoutes,
          setRouteInstructions,
          setRouteGeometry,
          setRemainingDistance,
          setRemainingTime,
          setError,
          setLoading,
          setSelectedRouteIndex,
          setShowInstructions,
        )
        setShowRouteInfo(true)
        setShowInstructions(false)
      } else {
        setError(
          "Position de départ non définie. Veuillez activer la géolocalisation ou entrer une position manuellement.",
        )
      }
    },
    [currentLocation, fetchRouteFromServer, setError],
  )

  const handleDirectionsClick = useCallback(() => {
    if (showRouteInfo) {
      setShowRouteInfo(false)
      setShowInstructions(false)
    } else if (routes.length > 0) {
      setShowRouteInfo(true)
      setShowInstructions(false)
    } else {
      console.log("handleDirectionsClick - currentLocation:", currentLocation, "positionArrivee:", positionArrivee)
      if (
        !currentLocation ||
        !Array.isArray(currentLocation) ||
        currentLocation.length !== 2 ||
        isNaN(currentLocation[0]) ||
        isNaN(currentLocation[1])
      ) {
        setError(
          "Position de départ non définie. Veuillez activer la géolocalisation ou entrer une position manuellement.",
        )
        return
      }
      if (
        !positionArrivee ||
        !Array.isArray(positionArrivee) ||
        positionArrivee.length !== 2 ||
        isNaN(positionArrivee[0]) ||
        isNaN(positionArrivee[1])
      ) {
        setError("Position d'arrivée non définie. Veuillez sélectionner une destination.")
        return
      }
      fetchRouteFromServer(
        currentLocation,
        positionArrivee,
        setRoutes,
        setRouteInstructions,
        setRouteGeometry,
        setRemainingDistance,
        setRemainingTime,
        setError,
        setLoading,
        setSelectedRouteIndex,
        setShowInstructions,
      )
      setShowRouteInfo(true)
      setShowInstructions(false)
    }
  }, [showRouteInfo, routes, currentLocation, positionArrivee, fetchRouteFromServer, setError])

  // Gestion des effets pour les fonctionnalités principales
  useEffect(() => {
    const interval = setInterval(() => {
      checkProximity(currentLocation, routeInstructions, isSpeaking, queueSpeech)
    }, 5000)
    return () => clearInterval(interval)
  }, [currentLocation, routeInstructions, isSpeaking, queueSpeech])

  const handleManualLocationSubmit = (e) => {
    e.preventDefault()
    const lat = Number.parseFloat(manualLocation.lat)
    const lon = Number.parseFloat(manualLocation.lon)
    if (!isNaN(lat) && !isNaN(lon)) {
      setCurrentLocation([lat, lon])
      setError(null)
    } else {
      setError("Coordonnées invalides.")
    }
  }

  // Afficher la vitesse actuelle (pour le débogage)
  useEffect(() => {
    if (speed > 0) {
      console.log(`Vitesse actuelle: ${(speed * 3.6).toFixed(1)} km/h, Cap: ${heading.toFixed(1)}°`)
    }
  }, [speed, heading])

  return (
    <ErrorBoundary>
      <div className="open-street-map-page">
        <div className="map-container">
          <MapComponent
            mapCenter={mapCenter}
            currentLocation={currentLocation}
            positionArrivee={positionArrivee}
            routeGeometry={routeGeometry}
            selectedRouteIndex={selectedRouteIndex}
            safePathIndex={safePathIndex}
            showZones={showZones}
            zones={zones}
            heading={speed > 1 ? heading : null} // N'afficher la flèche que si on se déplace
            isMonitoring={isMonitoring}
            traveledPath={traveledPath} // Nouveau prop pour le chemin parcouru
          />
          {isLoadingLocation && !currentLocation && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Récupération de votre position en cours...</p>
            </div>
          )}
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>En train de chercher l'itinéraire...</p>
            </div>
          )}
          <SearchBar
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            suggestions={suggestions}
            handleSelectSuggestion={handleSelectSuggestion}
            currentLocation={currentLocation}
          />
          <div className="show-zones-button">
            <button onClick={handleShowZonesClick} className={showZones ? "selected" : ""}>
              <i className="fas fa-layer-group"></i>
            </button>
          </div>
          {/* Interface du monitoring (isolée) */}
          <div className="monitoring-controls">
            {!isMonitoring ? (
              <button
                onClick={() => {
                  startMonitoring()
                  // Réinitialiser le chemin parcouru au démarrage
                  setTraveledPath([])
                }}
                disabled={routes.length === 0}
              >
                Démarrer
              </button>
            ) : (
              <button
                onClick={() => {
                  stopMonitoring()
                  // Réinitialiser le chemin parcouru à l'arrêt
                  setTraveledPath([])
                }}
              >
                Arrêter
              </button>
            )}
          </div>
          {deviationMessage && <p className="deviation-message">{deviationMessage}</p>}
          {/* Alerte de zone à risque */}
          {showAlert && (
            <div className="risk-zone-alert">
              <i className="fas fa-exclamation-triangle"></i>
              {alertMessage}
            </div>
          )}
          <PlaceDetails
            placeDetails={placeDetails}
            showDetails={showDetails}
            expandedCard={expandedCard}
            toggleCard={toggleCard}
            handleDirectionsClick={handleDirectionsClick}
            isCalculatingRoute={isCalculatingRoute}
            showRouteInfo={showRouteInfo}
          />
          <RouteInfo
            showRouteInfo={showRouteInfo}
            routes={routes}
            remainingDistance={remainingDistance}
            remainingTime={remainingTime}
            expandedCard={expandedCard}
            toggleCard={toggleCard}
            riskAnalysis={riskAnalysis}
            selectedRouteIndex={selectedRouteIndex}
            safePathIndex={safePathIndex}
            error={error}
            setSelectedRouteIndex={setSelectedRouteIndex}
            setRouteGeometry={setRouteGeometry}
            setRouteInstructions={setRouteInstructions}
            setRemainingDistance={setRemainingDistance}
            setRemainingTime={setRemainingTime}
            setShowInstructions={setShowInstructions}
            showInstructions={showInstructions}
            routeInstructions={routeInstructions}
          />
        </div>
        <ManualLocationForm
          error={error}
          currentLocation={currentLocation}
          manualLocation={manualLocation}
          setManualLocation={setManualLocation}
          handleManualLocationSubmit={handleManualLocationSubmit}
        />
      </div>
    </ErrorBoundary>
  )
}

export default OpenStreetMapPage
