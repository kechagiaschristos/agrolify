import store from "./store.js";
import {checkAuth} from '../features/auth/store/authSlice.js';

const Boot = async () => {
    store.dispatch(checkAuth());
};
export default Boot;
