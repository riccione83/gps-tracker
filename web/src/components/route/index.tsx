import L from "leaflet";
import { Polyline } from "react-leaflet";

const RouteComponent = ({ positions }) => {
  const pos = positions.map((p) => new L.LatLng(p.latitude, p.longitude, 0));
  return <>{<Polyline positions={pos} color="red" />}</>;
};

export default RouteComponent;
