import { auth, db } from "./database.js";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { cpu, displayGames, handleStartGame } from "./user-games.js";
import { startGame } from "./play-game.js";

let authStateUnsub = setAuthListener();
setHandlers();

function setAuthListener() {
    return onAuthStateChanged(auth, async (user) => {
        const signInPath = "/sign-in.html",
            signUpPath = "/sign-up.html",
            isSignIn = window.location.href.includes(signInPath),
            isSignUp = window.location.href.includes(signUpPath),
            isOutside = isSignIn || isSignUp,
            isGame = window.location.href.includes("/game.html");
        if (user && isOutside) {
            redirect();
        } else if (!user && !isOutside) {
            // redirect to user sign in, unless already there
            redirect(signInPath);
        } else if (!isGame) {
            document.querySelector("#hide-before-load").style.display = "block";
        }
        if (user) {
            await displayGames(user);
            const startGameBtn = document.querySelector("#start-game");
            startGameBtn &&
                (startGameBtn.onclick = () =>
                    handleStartGame({
                        playerId1: user.email,
                        playerId2: cpu,
                    }));
            isGame && (await startGame(user));
        }
    });
}

function redirect(path) {
    window.location.href = window.location.origin + (path || "");
}

function setHandlers() {
    const signInForm = document.querySelector("form#sign-in"),
        signUpForm = document.querySelector("form#sign-up"),
        signOutButton = document.querySelector("#sign-out");
    signInForm && (signInForm.onsubmit = handleSignIn);
    signUpForm && (signUpForm.onsubmit = handleSignUp);
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

async function handleSignUp(e) {
    e.preventDefault();
    const email = e.target.email.value,
        username = e.target.username.value.trim(),
        password = e.target.password.value;
    if (username.length < 3) {
        alert("Username is too short.");
        return;
    }
    if (await isUsernameTaken(username)) {
        alert("Username is already taken.");
        return;
    }
    try {
        // clear auth state change until after all is written
        authStateUnsub();
        await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", email), { username });
        // reset auth listener
        authStateUnsub = setAuthListener();
    } catch (err) {
        console.error(err);
        alert(err);
    }
}

async function isUsernameTaken(username) {
    const lowercase = username.toLowerCase();
    if (lowercase === "cpu") {
        return true;
    }
    const usernames = await getAllUsers();
    return usernames.includes(lowercase);
}

async function getAllUsers() {
    const usernames = [],
        docs = await getDocs(collection(db, "users"));
    docs.forEach((d) => {
        const { username } = d.data();
        usernames.push(username.toLowerCase());
    });
    return usernames;
}
