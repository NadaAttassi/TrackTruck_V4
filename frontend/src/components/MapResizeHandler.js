import { useMap } from 'react-leaflet';
import { useEffect } from 'react'; // Import useEffect from react

const MapResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    map.invalidateSize();
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);
  return null;
};

export default MapResizeHandler;
