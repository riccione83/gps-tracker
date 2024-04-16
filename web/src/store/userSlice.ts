import { User } from "@/gql-generated/graphql";
import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  user?: User;
}

const initialState: UserState = {
  user: undefined,
};

export const getState = (state: any): UserState => state || initialState;

export const userData = createSelector(getState, (state) => state.user);

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserState: (state, action: PayloadAction<User | undefined>) => {
      state.user = action.payload;
    },
  },
});

export const { setUserState } = userSlice.actions;
export const userReducer = userSlice.reducer;
