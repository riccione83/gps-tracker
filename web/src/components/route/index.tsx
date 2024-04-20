import ReactLeafletMultiOptionsPolyline, {
  multiOptions,
} from "@/utils/fleetmap";
import L from "leaflet";
import { Polyline } from "react-leaflet";

const RouteComponent = ({ positions, optionIdxFn, options }) => {
  // const pos: any[] = positions.map(
  //   (p) => new L.LatLng(p.latitude, p.longitude, 0)
  // );

  const pos: any[] = positions.map((p) => ({
    lat: p.latitude,
    lng: p.longitude,
    speed: p.speed,
  }));

  return (
    pos.length > 0 && (
      <ReactLeafletMultiOptionsPolyline
        positions={pos}
        optionIdxFn={optionIdxFn}
        options={options}
        weight={5}
        lineCap="butt"
        opacity={0.75}
        smoothFactor={1}
        zoomAnimation={true}
      />
    )
  );
  // return <Polyline positions={pos} color="red" />;
};

export default RouteComponent;
