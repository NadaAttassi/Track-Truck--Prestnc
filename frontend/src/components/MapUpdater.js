import { useMap } from 'react-leaflet';
import { useEffect } from 'react'; // Import useEffect from react

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
};

export default MapUpdater;
