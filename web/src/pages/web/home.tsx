"use client"; // this makes this component a client component
import "leaflet/dist/leaflet.css";
import isAuth from "@/components/protected-route";
import { Device } from "@/gql-generated/graphql";
import {
  getUserQuery,
  gpsQuery,
  latestGpsPositions,
  userQuery,
} from "@/queries";
import { addDevices, setDevicesState } from "@/store/deviceSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { useLazyQuery, useQuery } from "@apollo/client";
import L, { Icon } from "leaflet";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Marker, Polyline, Popup, Tooltip } from "react-leaflet";
import blueCircle from "../../components/map/assets/blue-circle.svg";

const Map = dynamic(() => import("../../components/map/map"), {
  ssr: false,
});

function Home() {
  const router = useRouter();
  const params = useSearchParams();
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const param = params?.get("d");
  const user = useAppSelector((state) => state.user?.user);
  const dispatch = useAppDispatch();
  const [latestPositions, setLatestPosition] = useState<any | null>(null);
  const [bounds, setBounds] = useState<any | null>(null);

  const { data, loading, error, refetch } = useQuery(getUserQuery, {
    variables: {
      userId: Number(user?.id),
    },
  });

  const [getGpsPositions, { data: gpsPositions }] = useLazyQuery(gpsQuery, {
    fetchPolicy: "network-only",
  });

  const [getLatestPositions, { data: _latestPositions }] = useLazyQuery(
    latestGpsPositions,
    {
      pollInterval: 5000,
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "network-only",
      onCompleted: (data) => {
        setLatestPosition(data);
      },
    }
  );

  const devicesList = useMemo(() => {
    return data?.user?.devices;
  }, [data, user]);

  useEffect(() => {
    getLatestPositions();
  }, [getLatestPositions]);

  useEffect(() => {
    if (param) {
      const curr = devicesList?.find((d) => `${d?.id}` === param);
      setCurrentDevice(curr as Device);
      curr &&
        curr.id &&
        getGpsPositions({
          variables: {
            deviceId: Number(curr?.id),
          },
          pollInterval: 6000,
          fetchPolicy: "no-cache",
        });
    } else {
      setCurrentDevice(null);
      getLatestPositions({
        variables: {
          userId: Number(user?.id),
        },
      });
    }
  }, [param, devicesList]);

  useLayoutEffect(() => {
    if (user) {
      if (devicesList && devicesList !== null) {
        // dispatch(setDevicesState(devicesList as Device[]));
        dispatch(addDevices(devicesList as Device[]));
      }
      setLoggedIn(true);
    } else {
      router.replace("/login");
    }
  }, [user, data]);

  useEffect(() => {
    setBounds(
      latestPositions &&
        latestPositions.latestPosition &&
        latestPositions.latestPosition.some((p) => p.coord !== null)
        ? latestPositions.latestPosition?.map(
            (p) => p.coord !== null && [p?.coord?.latitude, p?.coord?.longitude]
          )
        : undefined
    );
  }, [latestPositions]);

  if (loading) {
    return "Loading";
  } else if (error) {
    return <div onClick={() => refetch()}>{error.message}</div>;
  }

  return !loggedIn ? (
    "Loading"
  ) : (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 60px)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            paddingLeft: 8,
            paddingRight: 8,
            paddingBottom: 8,
            height: "calc(100%)",
          }}
        >
          {currentDevice && (
            <div
              style={{
                marginTop: 32,
                // borderTop: "1px solid grey",
                display: "flex",
                flexDirection: "row",
              }}
            >
              <div
                key={currentDevice?.serial}
                onClick={() => router.push(`/device?d=${currentDevice.id}`)}
                style={{
                  border: "1px solid grey",
                  padding: 16,
                  textAlign: "center",
                  marginBottom: 8,
                  cursor: "pointer",
                  marginRight: 8,
                  borderRadius: 4,
                  background: "grey",
                }}
              >
                Data for {currentDevice?.description}
              </div>
            </div>
          )}
          <div className="container">
            <h1 className="text-center-mt-5">Where was your device?</h1>
          </div>
          <Map
            center={param ? gpsPositions?.positions?.at(0) : undefined}
            bounds={!param && bounds ? bounds : undefined}
          >
            {param ? (
              <>
                {gpsPositions?.positions && (
                  <RouteComponent positions={gpsPositions?.positions} />
                )}
                {gpsPositions &&
                  gpsPositions.positions &&
                  gpsPositions?.positions.length > 1 && (
                    <>
                      <MarkerComponent
                        key={JSON.stringify(gpsPositions.positions[0])}
                        lat={gpsPositions.positions[0]?.latitude}
                        lng={gpsPositions.positions[0]?.longitude}
                        timestamp={gpsPositions.positions[0]?.timestamp}
                        text={"Start"}
                      />
                      <MarkerComponent
                        text={"End"}
                        key={JSON.stringify(
                          gpsPositions.positions[
                            gpsPositions.positions.length - 1
                          ]
                        )}
                        lat={
                          gpsPositions.positions[
                            gpsPositions.positions.length - 1
                          ]?.latitude
                        }
                        lng={
                          gpsPositions.positions[
                            gpsPositions.positions.length - 1
                          ]?.longitude
                        }
                        timestamp={
                          gpsPositions.positions[
                            gpsPositions.positions.length - 1
                          ]?.timestamp
                        }
                      />
                    </>
                  )}
              </>
            ) : (
              <>
                {latestPositions?.latestPosition?.map((p) => {
                  return (
                    <MarkerComponent
                      key={JSON.stringify(p)}
                      lat={p?.coord?.latitude}
                      lng={p?.coord?.longitude}
                      text={p?.description}
                      timestamp={undefined}
                    />
                  );
                })}
              </>
            )}
          </Map>
        </div>
      </div>
    </>
  );
}

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

const RouteComponent = ({ positions }) => {
  const pos = positions.map((p) => new L.LatLng(p.latitude, p.longitude, 0));
  return (
    <>
      <Polyline positions={pos} color="red" />
    </>
  );
};

export default isAuth(Home);
