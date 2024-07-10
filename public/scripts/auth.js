import { auth } from "./database.js";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { cpu, displayGames, handleStartGame } from "./user-games.js";
import { startGame } from "./play-game.js";

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
    onAuthStateChanged(auth, async (user) => {
        const pathName = "/sign-in.html",
            isSignIn = window.location.href.includes(pathName),
            isGame = window.location.href.includes("/game.html");
        if (user && isSignIn) {
            window.location.href = window.location.origin + "/index.html";
        } else if (!user && !isSignIn) {
            // redirect to user sign in, unless already there
            window.location.href = window.location.origin + pathName;
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
