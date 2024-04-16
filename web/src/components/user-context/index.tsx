// "use client"; //
// import { Device, User } from "@/gql-generated/graphql";
// import { userQuery } from "@/queries";
// import { setDevicesState } from "@/store/deviceSlice";
// import { useAppDispatch, useAppSelector } from "@/store/store";
// import { useQuery } from "@apollo/client";
// import * as React from "react";
// import { ReactNode, useState } from "react";

// type authContextType = {
//   // user: User | null;
//   isReady: boolean;
//   login: (user: User) => void;
//   // setDevices: (devices: Device[]) => void;
//   // getDevice: (devideIs: number) => Device | null;
//   logout: () => void;
//   reload: () => void;
//   // devices: Device[];
// };

// const authContextDefaultValues: authContextType = {
//   // user: null,
//   isReady: false,
//   // devices: [],
//   login: (user: User) => {},
//   // setDevices: (devices: Device[]) => {},
//   // getDevice: (devideIs: number) => null,
//   reload: () => {},
//   logout: () => {},
// };

// const AuthContext = React.createContext<authContextType>(
//   authContextDefaultValues
// );

// export function useAuth() {
//   return React.useContext(AuthContext);
// }

// type Props = {
//   children: ReactNode;
// };

// export function AuthProvider({ children }: Props) {
//   const [user, setUser] = useState<User | null>(null);

//   const [isReady, setReady] = useState(false);
//   const dispatch = useAppDispatch();
//   const devices = useAppSelector((state) => state.device.devices);

//   const { data, loading, error, refetch } = useQuery(userQuery, {
//     fetchPolicy: "network-only",
//     // pollInterval: 500,
//   });

//   React.useEffect(() => {
//     refetch();
//   }, []);

//   const devicesList = React.useMemo(() => {
//     return data?.users?.find((u) => `${user?.id}` === `${u?.id}`)?.devices;
//   }, [data, user]);

//   const reload = () => {
//     const userInfo = localStorage.getItem("login");
//     refetch();
//     if (userInfo) {
//       setUser(JSON.parse(userInfo));
//     }
//     setReady(true);
//   };

//   React.useEffect(() => {
//     const userInfo = localStorage.getItem("login");
//     if (userInfo) {
//       setUser(JSON.parse(userInfo));
//       if (devicesList && devicesList !== null) {
//         console.info("Setting:", devicesList);
//         // dispatch(setDevicesState(devicesList));
//         setDevices(devicesList);
//       }
//     }
//     setReady(true);
//   }, []);

//   const login = (user: User) => {
//     localStorage.setItem("login", JSON.stringify(user));

//     setUser(user);
//   };

//   const logout = () => {
//     localStorage.removeItem("login");
//     setUser(null);
//   };

//   const setDevices = (devices: Device[]) => {
//     dispatch(setDevicesState(devices));
//     // sDevices(devices);
//   };

//   const getDevice = (deviceId: number) => {
//     return devices.find((d) => d.id === deviceId) ?? null;
//   };

//   const value = {
//     // user,
//     // devices,
//     isReady,
//     setDevices,
//     getDevice,
//     login,
//     reload,
//     logout,
//   };
//   return (
//     <>
//       <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
//     </>
//   );
// }
