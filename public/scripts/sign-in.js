import { auth } from "./database.js";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";

setHandlers();
setSignInListener();

function setHandlers() {
    const signInForm = document.querySelector("form#sign-in"),
        signOutButton = document.querySelector("#sign-out");
    signInForm && (signInForm.onsubmit = handleSignIn);
    signOutButton && (signOutButton.onclick = () => signOut(auth));
}

async function handleSignIn(e) {
    e.preventDefault();
    const email = e.target.email.value,
        password = e.target.password.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        // sign in failed
        console.error(err);
        alert("Could not sign in.");
    }
}

function setSignInListener() {
    onAuthStateChanged(auth, (user) => {
        const pathName = "/sign-in.html",
            isSignIn = window.location.href.includes(pathName);
        if (user && isSignIn) {
            window.location.href = window.location.origin + "/index.html";
        } else if (!user && !isSignIn) {
            // redirect to user sign in, unless already there
            window.location.href = window.location.origin + pathName;
        } else {
            document.querySelector("#hide-before-load").style.display = "block";
        }
    });
}
