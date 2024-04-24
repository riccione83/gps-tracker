"use client"; // this makes this component a client component
import CalendarComponent from "@/components/calendar";
import CircleComponent from "@/components/circle";
import Loader from "@/components/loader";
import isAuth from "@/components/protected-route";
import { Device } from "@/gql-generated/graphql";
import {
  getGeofencesQuery,
  getUserQuery,
  gpsQuery,
  latestGpsPositions,
} from "@/queries";
import { addDevices } from "@/store/deviceSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { multiOptions } from "@/utils/fleetmap";
import { getFormattedDistance, getTotalDistance } from "@/utils/gps";
import { useLazyQuery, useQuery } from "@apollo/client";
import { Box, Flex } from "@chakra-ui/react";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { MdArrowBack as BackIcon } from "react-icons/md";

const Map = dynamic(() => import("../../components/map/map"), {
  ssr: false,
});

const MarkerComponent = dynamic(() => import("../../components/marker/index"), {
  ssr: false,
});

const RouteComponent = dynamic(() => import("../../components/route/index"), {
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
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const { data, loading, error, refetch } = useQuery(getUserQuery, {
    variables: {
      userId: Number(user?.id),
    },
  });

  const [getGpsPositions, { data: gpsPositions }] = useLazyQuery(gpsQuery, {
    fetchPolicy: "network-only",
  });

  const [getGeofences, { data: geofences }] = useLazyQuery(getGeofencesQuery, {
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
    user &&
      getLatestPositions({
        variables: {
          userId: Number(user.id),
        },
      });
    getGeofences({
      variables: {
        userId: Number(user.id),
      },
    });
  }, [getLatestPositions, user]);

  useEffect(() => {
    if (param) {
      const curr = devicesList?.find((d) => `${d?.id}` === param);
      setCurrentDevice(curr as Device);
      curr &&
        curr.id &&
        getGpsPositions({
          variables: {
            deviceId: Number(curr?.id),
            for: currentDate,
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
  }, [param, devicesList, currentDate]);

  useLayoutEffect(() => {
    if (user) {
      if (devicesList && devicesList !== null) {
        // dispatch(setDevicesState(devicesList as Device[]));
        dispatch(addDevices(devicesList as Device[]));
      }
      setLoggedIn(true);
    } else {
      router.replace("/auth/login");
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

  const totalDistance = useMemo(() => {
    const gps =
      gpsPositions?.positions
        ?.filter((p) => p && p.latitude && p.longitude)
        .map((p) => {
          return {
            lat: p!.latitude ?? 0,
            lng: p!.longitude ?? 0,
          };
        }) ?? [];
    return getTotalDistance(gps);
  }, [gpsPositions]);

  if (loading) {
    return <Loader />;
  } else if (error) {
    return <div onClick={() => refetch()}>{error.message}</div>;
  }

  return !loggedIn ? (
    <Loader />
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
          <Flex justifyContent={"space-between"} padding={2}>
            {!param ? (
              <Box>Your devices</Box>
            ) : (
              <Flex align={"baseline"}>
                <BackIcon
                  style={{ cursor: "pointer", marginRight: 8 }}
                  onClick={() => router.back()}
                />
                <div
                  key={currentDevice?.serial}
                  onClick={() =>
                    currentDevice &&
                    router.push(`/device?d=${currentDevice.id}`)
                  }
                  style={{
                    padding: 4,
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  {currentDevice?.description}
                </div>
              </Flex>
            )}
            {param && (
              <Box>
                Select a range{" "}
                <CalendarComponent
                  startDate={currentDate}
                  onChange={(date) => setCurrentDate(date)}
                />
              </Box>
            )}
          </Flex>
          {param && (
            <Flex justifyContent={"space-between"} padding={2}>
              Total distance: {getFormattedDistance(totalDistance)}
            </Flex>
          )}
          <Map
            center={param ? gpsPositions?.positions?.at(0) : undefined}
            bounds={!param && bounds ? bounds : undefined}
          >
            {geofences &&
              geofences.geofences?.map((g) => {
                return (
                  <CircleComponent
                    lat={g?.latitude}
                    lng={g?.longitude}
                    radius={g?.radius}
                  />
                );
              })}
            {param ? (
              <>
                {gpsPositions?.positions && (
                  // <RouteComponent positions={gpsPositions?.positions} />
                  <RouteComponent
                    positions={gpsPositions?.positions}
                    {...multiOptions["speed"]}
                  />
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
                  console.info(p);
                  return (
                    <MarkerComponent
                      key={JSON.stringify(p)}
                      lat={p?.coord?.latitude}
                      lng={p?.coord?.longitude}
                      text={p?.description}
                      activity={p?.activity}
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

export default isAuth(Home);
