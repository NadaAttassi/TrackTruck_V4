"use client"

import { useState, useCallback, useEffect } from "react"
import api from "../utils/api"

const useZones = (setError) => {
  const [zones, setZones] = useState([])
  const [showZones, setShowZones] = useState(false)

  const fetchZones = useCallback(async () => {
    try {
      console.log("Récupération des zones interdites...")
      // Utiliser l'instance api au lieu de fetch directement
      const response = await api.get("/api/zones/forbidden-zones")
      console.log("Zones reçues:", response.data)
      if (response.data.success) {
        setZones(response.data.zones)
        setError(null)
      } else {
        throw new Error(response.data.message || "Erreur lors de la récupération des zones")
      }
    } catch (err) {
      console.error("Erreur fetchZones:", err)
      setError("Impossible de récupérer les zones : " + err.message)
      setZones([])
    }
  }, [setError])

  useEffect(() => {
    fetchZones() // Appeler fetchZones au montage du composant
  }, [fetchZones])

  const handleShowZonesClick = useCallback(() => {
    if (showZones) {
      setShowZones(false)
    } else {
      fetchZones()
      setShowZones(true)
    }
  }, [showZones, fetchZones])

  return { zones, setZones, showZones, setShowZones, fetchZones, handleShowZonesClick }
}

export default useZones
