const selectAuthState = (state) => state.auth ?? {};

export const selectCheckAuthLoading = (state) => Boolean(selectAuthState(state).checkAuthLoading);

export const selectLoginLoading = (state) => Boolean(selectAuthState(state).loginLoading);

export const selectRegisterLoading = (state) => Boolean(selectAuthState(state).registerLoading);

export const selectIsAuthenticated = (state) => Boolean(selectAuthState(state).isAuthenticated);
