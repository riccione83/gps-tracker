"use client"; // this makes this component a client component
import CalendarComponent from "@/components/calendar";
import Loader from "@/components/loader";
import isAuth from "@/components/protected-route";
import { Device } from "@/gql-generated/graphql";
import { getUserQuery, gpsQuery, latestGpsPositions } from "@/queries";
import { addDevices } from "@/store/deviceSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { useLazyQuery, useQuery } from "@apollo/client";
import { Box, Flex } from "@chakra-ui/react";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

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
    getLatestPositions({
      variables: {
        userId: Number(user.id),
      },
    });
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
          <Flex justifyContent={"space-between"} padding={2}>
            <Box>Where was your device?</Box>
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

export default isAuth(Home);
