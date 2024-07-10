import { db } from "./database.js";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    setDoc,
} from "firebase/firestore";
import Deck from "./classes/Deck.js";
import Player from "./classes/Player.js";

const cpu = "CPU";

async function displayGames(user) {
    const gamesElem = document.querySelector("#games");
    if (gamesElem) {
        const games = await getGames(user.email);
        gamesElem.innerHTML += `
            <ul>
                ${Object.entries(games)
                    .map(([id, value]) => {
                        const opponent = Object.keys(value)
                            .filter((key) => key !== "deck")
                            .find((key) => key !== user.email);
                        return `
                            <li>
                                <a href="/game.html?id=${id}">
                                    ${opponent}
                                </a>
                            </li>
                        `;
                    })
                    .join("")}
            </ul>
        `;
    }
}

async function getGames(playerId) {
    const docs = await getDocs(collection(db, "games")),
        games = {};
    docs.forEach((game) => {
        const data = game.data();
        if (Object.keys(data).includes(playerId)) {
            games[game.id] = data;
        }
    });
    return games;
}

async function getGame(id) {
    const game = await getDoc(doc(db, "games", id));
    return game.data() || {};
}

async function handleStartGame({ playerId1, playerId2 }) {
    // only one game between two players
    const games = await getGames(playerId1);
    let [id] =
        Object.entries(games).find(([, value]) =>
            Object.keys(value).includes(playerId2)
        ) || [];
    if (id) {
        await deleteDoc(doc(db, "games", id));
    }
    // create new game
    id = await getId();
    const game = createGame({ playerId1, playerId2 });
    try {
        await setDoc(doc(db, "games", id), game);
        window.location.href = window.location.origin + `/game.html?id=${id}`;
    } catch (err) {
        console.error(err);
        alert("Could not create game.");
    }
}

async function getId() {
    let started, d, id;
    while (!started || d.exists()) {
        started = true;
        id = getRandomString(10);
        d = await getDoc(doc(db, "games", id));
    }
    return id;
}

function getRandomString(length) {
    const alphaNum = [
        ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    ];
    return new Array(length)
        .fill("")
        .map(() => alphaNum[~~(Math.random() * alphaNum.length)])
        .join("");
}

function createGame({ playerId1, playerId2 }) {
    const deck = new Deck(),
        player1 = new Player({ name: playerId1, deck }),
        player2 = new Player({ name: playerId2, deck });
    player1.setOpponent(player2);
    player2.setOpponent(player1);
    return updateGameHelper({ player1, player2, deck });
}

function updateGameHelper({ player1, player2, deck }) {
    const updatePlayer = (player) => {
        const { cards, hand, hp } = player;
        return { cards, hand, hp };
    };
    return {
        [player1.name]: updatePlayer(player1),
        [player2.name]: updatePlayer(player2),
        deck: deck.cards,
    };
}

async function updateGame({ id, player1, player2, deck }) {
    await setDoc(
        doc(db, "games", id),
        updateGameHelper({ player1, player2, deck })
    );
}

export { cpu, displayGames, getGame, handleStartGame, updateGame };
