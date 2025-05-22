"use client"

import { useState, useEffect, useRef } from "react"

const useDeviceOrientation = () => {
  const [heading, setHeading] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [lastPositions, setLastPositions] = useState([])
  const [permissionState, setPermissionState] = useState("unknown")
  const watchIdRef = useRef(null)

  // Fonction pour calculer le cap à partir de deux positions
  const calculateHeading = (startLat, startLng, destLat, destLng) => {
    const toRad = (deg) => (deg * Math.PI) / 180
    const toDeg = (rad) => (rad * 180) / Math.PI

    const startLatRad = toRad(startLat)
    const startLngRad = toRad(startLng)
    const destLatRad = toRad(destLat)
    const destLngRad = toRad(destLng)

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad)
    const x =
      Math.cos(startLatRad) * Math.sin(destLatRad) -
      Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad)

    let bearing = Math.atan2(y, x)
    bearing = toDeg(bearing)
    bearing = (bearing + 360) % 360

    return bearing
  }

  // Fonction pour calculer la vitesse entre deux positions
  const calculateSpeed = (lat1, lon1, lat2, lon2, time1, time2) => {
    const R = 6371e3 // Rayon de la Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distance en mètres

    const timeDiff = (time2 - time1) / 1000 // Différence de temps en secondes
    if (timeDiff <= 0) return 0

    return distance / timeDiff // Vitesse en m/s
  }

  // Effet pour demander la permission d'orientation si disponible
  useEffect(() => {
    const requestOrientationPermission = async () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        try {
          const permission = await DeviceOrientationEvent.requestPermission()
          setPermissionState(permission)
        } catch (error) {
          console.error("Erreur lors de la demande de permission d'orientation:", error)
          setPermissionState("granted") // On suppose que c'est accordé sur les appareils non-iOS
        }
      } else {
        // L'API ne nécessite pas de permission ou n'est pas disponible
        setPermissionState("granted")
      }
    }

    requestOrientationPermission()
  }, [])

  // Effet pour suivre la position et calculer l'orientation
  useEffect(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    const handlePositionUpdate = (position) => {
      const { latitude, longitude } = position.coords
      const timestamp = position.timestamp

      setLastPositions((prev) => {
        const newPositions = [...prev, { lat: latitude, lng: longitude, time: timestamp }]

        // Garder seulement les 5 dernières positions
        if (newPositions.length > 5) {
          newPositions.shift()
        }

        // Calculer le cap si nous avons au moins 2 positions
        if (newPositions.length >= 2) {
          const lastIdx = newPositions.length - 1
          const prevIdx = newPositions.length - 2

          const newHeading = calculateHeading(
            newPositions[prevIdx].lat,
            newPositions[prevIdx].lng,
            newPositions[lastIdx].lat,
            newPositions[lastIdx].lng,
          )

          const newSpeed = calculateSpeed(
            newPositions[prevIdx].lat,
            newPositions[prevIdx].lng,
            newPositions[lastIdx].lat,
            newPositions[lastIdx].lng,
            newPositions[prevIdx].time,
            newPositions[lastIdx].time,
          )

          // Ne mettre à jour le cap que si la vitesse est suffisante (> 0.5 m/s)
          if (newSpeed > 0.5) {
            setHeading(newHeading)
          }

          setSpeed(newSpeed)
        }

        return newPositions
      })
    }

    // Utiliser l'API DeviceOrientation si disponible et autorisée
    const handleDeviceOrientation = (event) => {
      if (event.webkitCompassHeading) {
        // Pour iOS
        setHeading(event.webkitCompassHeading)
      } else if (event.alpha) {
        // Pour Android
        setHeading(360 - event.alpha)
      }
    }

    if (permissionState === "granted") {
      // Écouter les événements d'orientation si disponibles
      window.addEventListener("deviceorientation", handleDeviceOrientation)

      // Suivre la position pour calculer le cap et la vitesse
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        (error) => {
          // Gérer les erreurs de géolocalisation de manière plus silencieuse
          if (error.code === 3) {
            // Timeout
            console.log("Délai de géolocalisation expiré, nouvelle tentative...")
          } else {
            console.error("Erreur de géolocalisation:", error.message)
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000, // Augmenter le timeout à 10 secondes
        },
      )
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      window.removeEventListener("deviceorientation", handleDeviceOrientation)
    }
  }, [permissionState])

  return { heading, speed, permissionState }
}

export default useDeviceOrientation
