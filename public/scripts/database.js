import { app } from "./fb-creds.js";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const auth = getAuth(app),
    db = getFirestore(app);

export { auth, db };
