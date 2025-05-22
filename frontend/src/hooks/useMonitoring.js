"use client"

// src/hooks/useMonitoring.js
import { useState, useCallback, useEffect } from "react"
import * as turf from "@turf/turf"

const useMonitoring = (
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
) => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [deviationMessage, setDeviationMessage] = useState(null)
  const [lastCheckTime, setLastCheckTime] = useState(0)

  const checkDeviation = useCallback(() => {
    if (!isMonitoring || !currentLocation || !routes[selectedRouteIndex] || !routes[selectedRouteIndex].geometry) {
      return
    }

    const now = Date.now()
    // Vérifier toutes les 5 secondes seulement
    if (now - lastCheckTime < 5000) {
      return
    }
    setLastCheckTime(now)

    const geometry = routes[selectedRouteIndex].geometry
    const currentPoint = turf.point([currentLocation[1], currentLocation[0]]) // [lon, lat]
    const line = turf.lineString(geometry.map((coord) => [coord[1], coord[0]])) // [lon, lat]
    const nearestPoint = turf.nearestPointOnLine(line, currentPoint, { units: "meters" })
    const minDistance = nearestPoint.properties.dist

    console.log("Distance minimale à l'itinéraire:", minDistance.toFixed(2), "mètres")

    if (minDistance > 1000) {
      setDeviationMessage("Vous vous êtes écarté de l'itinéraire. Recalcul en cours...")
      queueSpeech("Vous vous êtes écarté de l'itinéraire. Recalcul en cours.")
      recalculateRoutes()
    } else {
      setDeviationMessage(null)
    }
  }, [isMonitoring, currentLocation, routes, selectedRouteIndex, queueSpeech, lastCheckTime])

  const recalculateRoutes = async () => {
    if (!currentLocation || !positionArrivee) {
      setError("Impossible de recalculer l'itinéraire : position ou destination manquante.")
      return
    }

    setLoading(true)
    await fetchRouteFromServer(
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

  const startMonitoring = () => {
    if (!currentLocation || !positionArrivee || routes.length === 0) {
      setError("Veuillez sélectionner un point de départ et une destination, puis calculer un itinéraire.")
      return
    }
    setIsMonitoring(true)
    setDeviationMessage(null)
    console.log("Monitoring démarré...")
    queueSpeech("Navigation démarrée.")
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    setDeviationMessage(null)
    console.log("Monitoring arrêté.")
    queueSpeech("Navigation arrêtée.")
  }

  // Effect for monitoring (isolated within the hook)
  useEffect(() => {
    let intervalId

    if (isMonitoring) {
      // Vérifier la déviation toutes les secondes
      intervalId = setInterval(() => {
        checkDeviation()
      }, 1000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isMonitoring, checkDeviation])

  return {
    isMonitoring,
    deviationMessage,
    startMonitoring,
    stopMonitoring,
  }
}

export default useMonitoring
