"use client"

import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from "react-leaflet"
import MapUpdater from "./MapUpdater"
import MapResizeHandler from "./MapResizeHandler"
import DirectionMarker from "./DirectionMarker"
import { orangePinIcon, redPinIcon } from "../utils/iconUtils"
import { riskColors } from "../utils/riskUtils"
import "../components/DirectionMarker.css"
import { useEffect, useState } from "react"

const MapComponent = ({
  mapCenter,
  currentLocation,
  positionArrivee,
  routeGeometry,
  selectedRouteIndex,
  safePathIndex,
  showZones,
  zones,
  heading,
  isMonitoring,
}) => {
  const [traveledPath, setTraveledPath] = useState([])
  const [remainingPath, setRemainingPath] = useState([])

  // Diviser l'itinéraire en chemin parcouru et chemin restant
  useEffect(() => {
    if (!routeGeometry || routeGeometry.length === 0 || !currentLocation || !isMonitoring) {
      setTraveledPath([])
      setRemainingPath(routeGeometry || [])
      return
    }

    // Trouver le point le plus proche sur l'itinéraire
    let closestPointIndex = 0
    let minDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < routeGeometry.length; i++) {
      const point = routeGeometry[i]
      const distance = calculateDistance(currentLocation[0], currentLocation[1], point[0], point[1])

      if (distance < minDistance) {
        minDistance = distance
        closestPointIndex = i
      }
    }

    // Diviser l'itinéraire
    const traveled = routeGeometry.slice(0, closestPointIndex + 1)
    const remaining = routeGeometry.slice(closestPointIndex)

    // Ajouter la position actuelle au chemin parcouru si elle n'est pas déjà sur l'itinéraire
    if (minDistance > 0.0001) {
      // Seuil de tolérance en degrés (environ 10-20 mètres)
      traveled.push(currentLocation)
    }

    setTraveledPath(traveled)
    setRemainingPath(remaining)
  }, [routeGeometry, currentLocation, isMonitoring])

  // Fonction pour calculer la distance entre deux points (formule de Haversine simplifiée)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapUpdater center={mapCenter} zoom={13} />
      <MapResizeHandler />

      {currentLocation && (
        <>
          {/* Marqueur de position standard (masqué si la flèche directionnelle est active) */}
          {heading === null && (
            <Marker position={currentLocation} icon={orangePinIcon}>
              <Popup>Vous êtes ici</Popup>
            </Marker>
          )}

          {/* Flèche directionnelle */}
          {heading !== null && <DirectionMarker position={currentLocation} heading={heading} />}
        </>
      )}

      {positionArrivee && (
        <Marker position={positionArrivee} icon={redPinIcon}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {/* Afficher le chemin parcouru en vert */}
      {isMonitoring && traveledPath.length > 0 && (
        <Polyline
          positions={traveledPath}
          color="#4CAF50" // Vert
          weight={6}
          opacity={0.9}
        />
      )}

      {/* Afficher le chemin restant en bleu ou violet */}
      {routeGeometry &&
        routeGeometry.length > 0 &&
        (isMonitoring && remainingPath.length > 0 ? (
          <Polyline
            positions={remainingPath}
            color={safePathIndex === selectedRouteIndex ? "purple" : "blue"}
            weight={5}
            opacity={0.8}
          />
        ) : (
          <Polyline
            positions={routeGeometry}
            color={safePathIndex === selectedRouteIndex ? "purple" : "blue"}
            weight={5}
            opacity={0.8}
          />
        ))}

      {showZones &&
        zones.map((zone, index) => {
          const normalizedRisk = zone.risk?.toLowerCase() || "inconnu"
          const fillOpacity = normalizedRisk === "élevé" ? 0.5 : normalizedRisk === "moyen" ? 0.4 : 0.3
          const weight = normalizedRisk === "élevé" ? 3 : 2

          return (
            <Polygon
              key={index}
              positions={zone.geometry.map((coord) => [coord.lat, coord.lon])}
              pathOptions={{
                color: riskColors[normalizedRisk] || "gray",
                fillColor: riskColors[normalizedRisk] || "gray",
                fillOpacity: fillOpacity,
                weight: weight,
              }}
            >
              <Popup>
                <strong>Zone: {zone.zoneId}</strong> <br />
                <span style={{ color: riskColors[normalizedRisk] }}>Risque: {zone.risk || "Inconnu"}</span> <br />
                Type: {zone.tags.landuse || "Inconnu"}
              </Popup>
            </Polygon>
          )
        })}
    </MapContainer>
  )
}

export default MapComponent
