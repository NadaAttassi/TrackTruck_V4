"use client"

import { useState, useCallback } from "react"
import api from "../utils/api"

const useSuggestions = (setError) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])

  const fetchSuggestions = useCallback(
    async (query) => {
      if (!query) {
        setSuggestions([])
        setError(null)
        return
      }
      try {
        console.log("Recherche suggestions:", query)
        // Utiliser l'instance api au lieu de fetch directement
        const response = await api.post("/api/suggestions", { query })
        console.log("Suggestions reçues:", response.data)
        setSuggestions(response.data)
        setError(response.data.length === 0 ? 'Aucune suggestion trouvée pour "' + query + '".' : null)
      } catch (err) {
        console.error("Erreur fetchSuggestions:", err)
        setSuggestions([])
        setError("Impossible de récupérer les suggestions : " + err.message)
      }
    },
    [setError],
  )

  return { searchQuery, setSearchQuery, suggestions, setSuggestions, fetchSuggestions }
}

export default useSuggestions
