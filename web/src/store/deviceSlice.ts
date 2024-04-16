import { Device } from "@/gql-generated/graphql";
import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export const ADD_DEVICES = "ADD_DEVICES";

export const addDevices = (devices: Device[]) => ({
  type: ADD_DEVICES,
  payload: {
    devices,
  },
});

export interface DeviceState {
  devices: Device[];
}

const initialState: DeviceState = {
  devices: [],
};

export const getState = (state: any): DeviceState => state || initialState;
export const getDevices = createSelector(getState, (state) => state.devices);

export const devicesSlice = createSlice({
  name: "devices",
  initialState,
  reducers: {
    setDevicesState: (state, action: PayloadAction<Device[]>) => {
      state.devices = action.payload;
    },
  },
});

export const { setDevicesState } = devicesSlice.actions;
// export const deviceReducer = devicesSlice.reducer;

export function deviceReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_DEVICES: {
      return { ...state, devices: action.payload.devices };
    }
    default:
      return state;
  }
}
