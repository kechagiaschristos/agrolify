import {createSlice} from '@reduxjs/toolkit';

const realtimeSlice = createSlice({
    name: 'realtime',
    initialState: {status: 'connecting'},
    reducers: {
        setConnectionStatus: (state, action) => { state.status = action.payload; },
    },
    extraReducers: (builder) => {
        builder.addCase('user/clearUserState', () => ({status: 'connecting'}));
    },
});

export const {setConnectionStatus} = realtimeSlice.actions;
export const realtimeReducer = realtimeSlice.reducer;
