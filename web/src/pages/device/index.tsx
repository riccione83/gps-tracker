"use client"; //
import isAuth from "@/components/protected-route";
import {
  deleteDeviceMutation,
  deviceQuery,
  editDeviceMutation,
} from "@/queries";
import { setDevicesState } from "@/store/deviceSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import {
  MdArrowBack as BackIcon,
  MdDelete as DeleteIcon,
} from "react-icons/md";
import "./style.css";

const DevicePage = () => {
  const router = useRouter();

  const devices = useAppSelector((state) => state.device.devices);
  const dispatch = useAppDispatch();

  const [getDevice, { loading, data, refetch }] = useLazyQuery(deviceQuery, {
    fetchPolicy: "network-only",
  });

  const [deleteDevice, {}] = useMutation(deleteDeviceMutation, {
    fetchPolicy: "network-only",
  });

  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (router.isReady && !router.query.d) {
      router.push("/");
    } else {
      getDevice({
        variables: {
          id: Number(router.query.d),
        },
      });
    }
  }, [router.query]);

  return (
    <div style={{ padding: 8 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <BackIcon
          style={{ cursor: "pointer", marginRight: 8 }}
          onClick={() => router.back()}
        />
        Your device: {data?.device?.description}
      </div>
      <div>
        <div>Rename your device</div>
        <RenameDeviceComponent
          deviceId={Number(router.query.d)}
          onRename={(text) => {
            const d = [...devices];
            const ind = d.findIndex((s) => s.id === Number(router.query.d));
            let n = { ...d[ind], description: text };
            d[ind] = n;
            dispatch(setDevicesState(d));
            // setDevices(d);
            refetch({ id: Number(router.query.d) });
          }}
        />
      </div>
      <div className="table_component">
        <table>
          <caption>Latest {limit} GPS positions</caption>
          <thead>
            <tr>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {data?.device?.positions?.slice(0, limit).map((p) => {
              return (
                <tr key={p?.timestamp}>
                  <td>{p?.latitude}</td>
                  <td>{p?.longitude}</td>
                  <td>
                    {p?.timestamp ? new Date(p.timestamp).toISOString() : "NA"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {data?.device?.positions &&
            data?.device?.positions?.length > limit && (
              <tfoot
                style={{ cursor: "pointer", fontWeight: "bold" }}
                onClick={() => setLimit(limit + 10)}
              >
                Load more
              </tfoot>
            )}
        </table>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginTop: 16 }}>
        <DeleteIcon
          style={{
            cursor: "pointer",
            marginRight: 8,
            color: "red",
            height: 40,
          }}
          onClick={() => {
            const confirm = window.confirm("You sure?");
            if (confirm) {
              deleteDevice({
                variables: {
                  id: Number(router.query.d),
                },
                onCompleted: () => router.push("/"),
              });
            }
          }}
        />
        Delete your device and data
      </div>
    </div>
  );
};

const RenameDeviceComponent = ({ deviceId, onRename }) => {
  const txt = useRef<HTMLInputElement | null>(null);
  const [renameDevice, { loading, error, data }] = useMutation(
    editDeviceMutation,
    {
      fetchPolicy: "network-only",
      // pollInterval: 500,
    }
  );

  const [text, setText] = useState("");

  const handleRenameAction = () => {
    if (text.length > 0) {
      const newProj = renameDevice({
        variables: {
          deviceId: Number(deviceId),
          description: text,
        },
        refetchQueries: [deviceQuery],
        onCompleted: () => onRename(text),
        update(cache) {
          cache.evict({ fieldName: "devices" });
        },
      });
      txt.current!.value = "";
    }
  };

  return (
    <div>
      <input
        style={{ marginTop: 8 }}
        ref={txt}
        type="text"
        onChange={(e) => setText(e.currentTarget.value)}
      ></input>
      <button onClick={handleRenameAction}>Submit</button>
      <div style={{ marginTop: 32, borderTop: "1px solid grey" }} />
    </div>
  );
};

export default isAuth(DevicePage);
