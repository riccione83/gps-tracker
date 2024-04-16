import { Device } from "@/gql-generated/graphql";
import { deleteDeviceMutation, latestGpsPositions, userQuery } from "@/queries";
import { addDevices, getDevices, setDevicesState } from "@/store/deviceSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import "./styles.css";
import { Button } from "@chakra-ui/react";

export default function DeviceManagementScene() {
  const [latestPositions, setLatestPosition] = useState<any | null>(null);

  const d = useSelector(getDevices);
  const user = useAppSelector((state) => state.user?.user);
  const devices = useAppSelector((state) => state.device?.devices);
  const dispatch = useAppDispatch();
  const { data, loading, error, refetch } = useQuery(userQuery, {
    // fetchPolicy: "network-only",
  });

  const { loading: latestPositionsLoading, data: _latestPositions } = useQuery(
    latestGpsPositions,
    {
      variables: {
        userId: Number(user?.id),
      },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "network-only",
      onCompleted: (data) => {
        setLatestPosition(data);
      },
    }
  );

  const [deleteDevice, {}] = useMutation(deleteDeviceMutation, {
    fetchPolicy: "network-only",
  });

  const devicesList = useMemo(() => {
    return data?.users?.find((u) => `${user?.id}` === `${u?.id}`)?.devices;
  }, [data, user]);

  useEffect(() => {
    if (user) {
      if (devicesList && devicesList !== null) {
        dispatch(addDevices(devicesList as Device[]));
        // dispatch(setDevicesState(devicesList as Device[]));
      }
    }
  }, [devicesList]);

  if (latestPositionsLoading) return "Loading";

  return (
    <div>
      <div className="table_component">
        <table style={{ width: "100%" }}>
          <caption style={{ marginBottom: 32, fontWeight: "bold" }}>
            My devices
          </caption>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th>Description</th>
              <th>Serial</th>
              <th>Last seen</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((p) => {
              const latest =
                latestPositions &&
                latestPositions?.latestPosition.find(
                  (d) => `${d.id}` === `${p.id}`
                );
              return (
                <tr key={p.id}>
                  <td>{p?.description}</td>
                  <td>{p?.serial}</td>
                  <td>
                    {latest && latest.coord
                      ? `${new Date(latest.coord.timestamp).toISOString()}`
                      : "NA"}
                  </td>
                  <td>
                    <Button
                      onClick={() => {
                        deleteDevice({
                          variables: {
                            id: Number(p.id),
                          },
                          refetchQueries: [latestGpsPositions],
                          onCompleted: () => refetch(),
                        });
                      }}
                      colorScheme="red"
                      size={"sm"}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
