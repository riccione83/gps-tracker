"use client";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, useStore } from "react-redux";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { deviceReducer } from "./deviceSlice";
import { userReducer } from "./userSlice";

const persistConfig = {
  key: "persist",
  storage,
  blacklist: ["test"],
};

const initialReducer = {
  user: userReducer,
  device: deviceReducer,
};

const rootReducer = combineReducers(initialReducer);

const makeConfiguredStore = () =>
  configureStore({
    reducer: rootReducer,
  });

export const makeStore = () => {
  const isServer = typeof window === "undefined";
  if (isServer) {
    console.info("Using server redux");
    return makeConfiguredStore();
  } else {
    const persistedReducer = persistReducer(persistConfig, rootReducer);
    console.info("Using client redux");

    let store: any = configureStore({
      reducer: persistedReducer,
      devTools: process.env.NODE_ENV !== "production",
    });
    store.__persistor = persistStore(store);
    return store; // makeConfiguredStore();
  }
};

export const InjectReducer = (reducer: any) => {
  const store = useStore();
  const newRootReducer = combineReducers({
    ...initialReducer,
    ...reducer,
  });
  const persistedReducer = persistReducer(persistConfig, newRootReducer);
  console.info("Configuring new store");
  store.replaceReducer(persistedReducer);
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
