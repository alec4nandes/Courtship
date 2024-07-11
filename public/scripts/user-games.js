import { db } from "./database.js";
import {
    arrayRemove,
    arrayUnion,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import Deck from "./classes/Deck.js";
import Player from "./classes/Player.js";

const cpu = "CPU";

async function displayGames(user) {
    const gamesElem = document.querySelector("#games");
    if (gamesElem) {
        const games = await getGames(user.email),
            listItems = (
                await Promise.all(
                    games.map(async (gameId) => {
                        const game = await getGame(gameId),
                            opponent = Object.keys(game)
                                .filter((key) => key !== "deck")
                                .find((key) => key !== user.email);
                        return `
                            <li>
                                <a href="/game.html?id=${gameId}">
                                    ${await getUsername(opponent)}
                                </a>
                            </li>
                        `;
                    })
                )
            ).join("");
        gamesElem.innerHTML += games.length
            ? `<ul>${listItems}</ul>`
            : "<p><em>No games in progress.</em></p>";
    }
}

async function getGames(playerId) {
    const d = await getDoc(doc(db, "users", playerId)),
        { games } = d.data() || {};
    return games || [];
}

async function getGame(gameId) {
    if (!gameId) {
        return {};
    }
    const game = await getDoc(doc(db, "games", gameId));
    return game.data() || {};
}

async function getUsername(name) {
    const d = await getDoc(doc(db, "users", name));
    if (d.exists()) {
        const { username } = d.data();
        return username;
    }
    return name;
}

async function handleStartGame({ playerId1, playerId2 }) {
    // only one game between two players
    const games = await getGames(playerId1),
        [oldId] = (
            await Promise.all(
                games.map(async (game) => [game, await getGame(game)])
            )
        ).find(([, value]) => Object.keys(value).includes(playerId2)),
        editGameIdsHelper = async ({ playerId, func, id }) => {
            const docRef = doc(db, "users", playerId),
                d = await getDoc(docRef);
            d.exists() &&
                (await updateDoc(docRef, {
                    games: func(id),
                }));
        },
        editGameIds = async ({ func, id }) => {
            for (const playerId of [playerId1, playerId2]) {
                await editGameIdsHelper({ playerId, func, id });
            }
        };
    if (oldId) {
        // remove old id from db
        await deleteDoc(doc(db, "games", oldId));
        await editGameIds({ func: arrayRemove, id: oldId });
    }
    // create new game
    const id = await getId(),
        game = createGame({ playerId1, playerId2 });
    try {
        // add id to db
        await setDoc(doc(db, "games", id), game);
        await editGameIds({ func: arrayUnion, id });
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

async function updateGame({ gameId, player1, player2, deck }) {
    await setDoc(
        doc(db, "games", gameId),
        updateGameHelper({ player1, player2, deck })
    );
}

export { cpu, displayGames, getGame, getUsername, handleStartGame, updateGame };
