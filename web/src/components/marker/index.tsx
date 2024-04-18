import L, { Icon } from "leaflet";
import { Marker, Popup, Tooltip } from "react-leaflet";
import blueCircle from "../../components/map/assets/blue-circle.svg";

interface MarkerProps {
  lat: number | null | undefined;
  lng: number | null | undefined;
  timestamp?: string;
  text?: string | null | undefined;
}

const MarkerComponent = ({ lat, lng, timestamp, text }: MarkerProps) => {
  if (!lat || !lng) return null;
  const pos = new L.LatLng(lat, lng, 0);
  return (
    <Marker
      title="test"
      position={pos}
      icon={
        new Icon({
          iconUrl: blueCircle.src,
          iconSize: [25, 41],
          iconAnchor: [12, 20],
        })
      }
    >
      {timestamp && (
        <Popup>Current time is {new Date(timestamp).toISOString()}</Popup>
      )}
      {text && (
        <Tooltip direction="right" offset={[6, 0]} opacity={1} permanent>
          <span>{text}</span>
        </Tooltip>
      )}
    </Marker>
  );
};

export default MarkerComponent;
