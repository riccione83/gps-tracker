import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Rectangle,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "./map.css";

const MapComponent: React.FC<{ children; center?; bounds? }> = ({
  children,
  center,
  bounds,
}) => {
  const ZOOM_LEVEL = 9;
  const mapRef = useRef<any>(null);
  const [useBounds, setUseBounds] = useState(true);
  const [isLoaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    center &&
      !bounds &&
      mapRef.current?.setView(
        [center.latitude, center.longitude],
        mapRef.current?.getZoom()
      );
  }, [center, bounds]);

  function MyComponent() {
    const map = useMapEvents({
      dragend: () => {
        setUseBounds(false);
      },
      click: () => {
        map.locate();
        setUseBounds(false);
      },
      locationfound: (location) => {
        console.log("location found:", location);
      },
    });
    return null;
  }

  // const [ref, { width, height }] = useMeasure();

  if (!isLoaded) return null;

  function SetBoundsRectangles() {
    const [_bounds, setBounds] = useState(bounds);
    const map = useMap();

    useEffect(() => {
      !center && useBounds && map.fitBounds(bounds);
    }, [bounds, center]);

    const redColor = { color: "red" };

    return (
      <>
        <Rectangle bounds={bounds} pathOptions={redColor} />
      </>
    );
  }

  return (
    <div
      className="container"
      // ref={ref}
      style={{
        width: 200,
        height: 300,
        minWidth: "100%",
        flex: 1,
      }}
    >
      <MapContainer
        // bounds={bounds}
        wheelDebounceTime={100}
        style={{ flex: 1, width: "100%" }}
        center={
          !bounds
            ? center
              ? [center.latitude, center.longitude]
              : [51.505, -0.09]
            : undefined
        }
        zoom={ZOOM_LEVEL}
        ref={mapRef}
        scrollWheelZoom={true}
        attributionControl={undefined}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {children}
        <MyComponent />
        {bounds && !center && <SetBoundsRectangles />}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
