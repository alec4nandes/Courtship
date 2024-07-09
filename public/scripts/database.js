import { app } from "./fb-creds.js";
import { getAuth } from "firebase/auth";

const auth = getAuth(app);

export { auth };
