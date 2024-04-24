import L from "leaflet";
import { Circle, CircleMarker } from "react-leaflet";

interface CircleProps {
  lat: number | null | undefined;
  lng: number | null | undefined;
  radius: number | null | undefined;
  text?: string | null | undefined;
}

const CircleComponent = ({ lat, lng, text, radius }: CircleProps) => {
  if (!lat || !lng) return null;
  const pos = new L.LatLng(lat, lng, 0);
  return (
    <Circle
      center={pos}
      radius={radius ? radius * 1000 : 0}
      interactive={false}
    ></Circle>
  );
};

export default CircleComponent;
