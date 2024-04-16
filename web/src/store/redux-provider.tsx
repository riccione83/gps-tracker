"use client";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "./store";
import { ReactNode, useEffect, useRef } from "react";
// import { persistStore } from "redux-persist";
import { setupListeners } from "@reduxjs/toolkit/query";
import { PersistGate } from "redux-persist/integration/react";

interface Props {
  readonly children: ReactNode;
  storeRef: any;
}

export default function ReduxProvider({ children, storeRef }: Props) {
  console.info("store ref", storeRef.current);
  if (!storeRef.current) {
    console.info("No store, crearting a new one");
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  useEffect(() => {
    if (storeRef.current != null) {
      // configure listeners using the provided defaults
      // optional, but required for `refetchOnFocus`/`refetchOnReconnect` behaviors
      const unsubscribe = setupListeners(storeRef.current.dispatch);
      return unsubscribe;
    }
  }, []);

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={storeRef.current.__persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
  // return <Provider store={storeRef.current}>{children}</Provider>;
}
