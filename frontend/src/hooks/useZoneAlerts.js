"use client"

import { useState, useEffect, useCallback } from "react"
import isPointInPolygon from "../utils/isPointInPolygon"

const useZoneAlerts = (currentLocation, zones, queueSpeech, isMonitoring) => {
  const [currentZone, setCurrentZone] = useState(null)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertTimeout, setAlertTimeout] = useState(null)
  const [lastAlertTime, setLastAlertTime] = useState(0)
  const [lastZoneId, setLastZoneId] = useState(null)

  // Fonction pour vérifier si un point est dans une zone
  const checkZone = useCallback(
    (lat, lon) => {
      if (!lat || !lon || !zones || zones.length === 0) return null

      const point = { lat, lon }

      for (const zone of zones) {
        if (isPointInPolygon(point, zone.geometry)) {
          return zone
        }
      }

      return null
    },
    [zones],
  )

  // Effet pour détecter l'entrée dans une zone à risque
  useEffect(() => {
    if (!isMonitoring || !currentLocation || !Array.isArray(currentLocation) || currentLocation.length !== 2) {
      return
    }

    const [lat, lon] = currentLocation
    const detectedZone = checkZone(lat, lon)

    // Si nous sommes dans une zone à risque
    if (detectedZone) {
      const normalizedRisk = detectedZone.risk?.toLowerCase() || "inconnu"

      // N'alerter que pour les zones à risque élevé
      if (normalizedRisk === "élevé") {
        // Si c'est une nouvelle zone ou si nous sommes toujours dans la même zone à risque élevé
        if (!currentZone || detectedZone.zoneId !== lastZoneId) {
          const message = `Attention ! Zone à risque élevé`

          // Afficher l'alerte visuelle
          setAlertMessage(message)
          setShowAlert(true)
          setLastZoneId(detectedZone.zoneId)

          // Notification sonore
          queueSpeech(message)

          // Masquer l'alerte après 4 secondes
          if (alertTimeout) {
            clearTimeout(alertTimeout)
          }

          const timeout = setTimeout(() => {
            setShowAlert(false)
          }, 4000)

          setAlertTimeout(timeout)
        }
        // Si nous sommes toujours dans la même zone à risque élevé, rappeler périodiquement
        else {
          const now = Date.now()
          // Rappeler toutes les 30 secondes pour les zones à risque élevé
          if (now - lastAlertTime > 30000) {
            const message = `Attention ! Vous êtes toujours dans une zone à risque élevé`

            // Notification sonore uniquement
            queueSpeech(message)

            setLastAlertTime(now)
          }
        }
      }
    }

    setCurrentZone(detectedZone)

    return () => {
      if (alertTimeout) {
        clearTimeout(alertTimeout)
      }
    }
  }, [
    currentLocation,
    zones,
    currentZone,
    checkZone,
    queueSpeech,
    lastAlertTime,
    alertTimeout,
    isMonitoring,
    lastZoneId,
  ])

  return { showAlert, alertMessage, currentZone }
}

export default useZoneAlerts
