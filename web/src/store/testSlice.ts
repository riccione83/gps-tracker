import { User } from "@/gql-generated/graphql";
import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  user?: User;
  testData?: any;
}

const initialState: UserState = {
  user: undefined,
  testData: [],
};

export const getState = (state: any): UserState => state || initialState;

export const userData = createSelector(getState, (state) => state.user);

export const testSlice = createSlice({
  name: "test",
  initialState,
  reducers: {
    setUserState: (state, action: PayloadAction<User | undefined>) => {
      state.user = action.payload;
    },
  },
});

export const { setUserState } = testSlice.actions;
export const testReducer = testSlice.reducer;
