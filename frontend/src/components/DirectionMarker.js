"use client"

import { useEffect, useState, useRef } from "react"
import { Marker, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet-rotatedmarker"

// Création d'une icône personnalisée pour la flèche de direction
const createDirectionIcon = (heading) => {
  return L.divIcon({
    html: `
      <div class="direction-marker" style="transform: rotate(${heading}deg)">
        <div class="direction-arrow"></div>
      </div>
    `,
    className: "direction-marker-container",
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  })
}

const DirectionMarker = ({ position, heading, routeGeometry, isMonitoring }) => {
  const [directionIcon, setDirectionIcon] = useState(null)
  const map = useMap()
  const lastPositionRef = useRef(null)
  const pathRef = useRef(null)

  useEffect(() => {
    if (position) {
      // Créer l'icône de direction même si heading est null
      const icon = createDirectionIcon(heading || 0)
      setDirectionIcon(icon)

      // Centrer la carte sur la position actuelle avec un léger décalage vers le haut
      if (map && isMonitoring) {
        map.panTo(position)
      }

      // Mettre à jour le chemin parcouru si on est en mode monitoring
      if (isMonitoring && routeGeometry && routeGeometry.length > 0) {
        // Si c'est la première position ou si la position a changé significativement
        if (
          !lastPositionRef.current ||
          lastPositionRef.current[0] !== position[0] ||
          lastPositionRef.current[1] !== position[1]
        ) {
          // Mettre à jour la dernière position connue
          lastPositionRef.current = position

          // Créer ou mettre à jour le chemin parcouru
          if (!pathRef.current) {
            pathRef.current = L.polyline([position], {
              color: "#3388ff",
              weight: 5,
              opacity: 0.7,
              dashArray: "10, 10",
              className: "traveled-path",
            }).addTo(map)
          } else {
            // Ajouter la nouvelle position au chemin
            pathRef.current.addLatLng(position)

            // Limiter le chemin parcouru aux 20 derniers points pour qu'il s'efface progressivement
            if (pathRef.current.getLatLngs().length > 20) {
              const points = pathRef.current.getLatLngs()
              pathRef.current.setLatLngs(points.slice(points.length - 20))
            }
          }
        }
      }
    }
  }, [position, heading, map, isMonitoring, routeGeometry])

  // Nettoyer le chemin parcouru quand le composant est démonté
  useEffect(() => {
    return () => {
      if (pathRef.current) {
        map.removeLayer(pathRef.current)
      }
    }
  }, [map])

  if (!position || !directionIcon) return null

  return (
    <Marker
      position={position}
      icon={directionIcon}
      zIndexOffset={1000} // S'assurer que la flèche est au-dessus des autres marqueurs
    />
  )
}

export default DirectionMarker
