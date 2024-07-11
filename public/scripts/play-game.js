import { getNumbered } from "./misc.js";
import {
    cpu,
    getGame,
    getUsername,
    handleStartGame,
    updateGame,
} from "./user-games.js";
import {
    displayNames,
    displayPlayerHpAndCards,
    displayDrawPileCount,
    displayRecentMoves,
    getCurrentPlayerKey,
    toggleDisabled,
} from "./display.js";
import { setHandlers } from "./handlers.js";
import Deck from "./classes/Deck.js";
import Player from "./classes/Player.js";

/*
    Gameplay:
        * create new Deck object
        * pass Deck object to 2 new Player objects
        * set each player as each other's opponent
            * Player.setOpponent(opponent)
        * DOM setup: display elements & add handlers
*/

async function startGame(user) {
    const verified = await verifyGame(user);
    if (verified) {
        const { gameId, game, ids } = verified,
            { playerKeys, deck, players } = getPlayersAndDeck({ game, ids }),
            isAuto = ids.includes(cpu),
            state = { lastPlayerKey: playerKeys[1] };
        displayNames({ playerKeys, players });
        await displayPlayers();
        setHandlers({
            playerKeys,
            players,
            displayPlayers,
            isAuto,
            state,
        });
        document.querySelector("#hide-before-load").style.display = "block";

        async function displayPlayers() {
            displayPlayerHpAndCards({ playerKeys, players, user });
            displayDrawPileCount(deck);
            const { lastPlayerKey } = state;
            await displayRecentMoves({ playerKeys, lastPlayerKey, players });
            state.lastPlayerKey = getCurrentPlayerKey({
                playerKeys,
                lastPlayerKey,
            });
            toggleDisabled({ override: false, lastPlayerKey, playerKeys });
            await update({ gameId, players, playerKeys, deck });
            return await gameOver({ players, deck, playerKeys, lastPlayerKey });
        }
    }
}

async function verifyGame(user) {
    const gameId = getSearchParam("id"),
        game = await getGame(gameId);
    let ids = Object.keys(game).filter((key) => key !== "deck");
    if (ids.includes(user.email)) {
        ids = [user.email, ids.find((id) => id !== user.email)];
        return { gameId, game, ids };
    } else {
        alert("You don't have access to this game. Check the URL.");
        window.location.href = window.location.origin;
    }
}

function getSearchParam(param) {
    const params = new URLSearchParams(document.location.search);
    return params.get(param);
}

function getPlayersAndDeck({ game, ids }) {
    const playerKeys = ["player", "opponent"],
        deck = new Deck(game.deck),
        players = {
            [playerKeys[0]]: new Player({
                name: ids[0],
                game: game[ids[0]],
                deck,
            }),
            [playerKeys[1]]: new Player({
                name: ids[1],
                game: game[ids[1]],
                deck,
                isHidden: true,
            }),
        };
    players[playerKeys[0]].setOpponent(players[playerKeys[1]]);
    players[playerKeys[1]].setOpponent(players[playerKeys[0]]);
    return { playerKeys, deck, players };
}

async function update({ gameId, players, playerKeys, deck }) {
    await updateGame({
        gameId,
        player1: players[playerKeys[0]],
        player2: players[playerKeys[1]],
        deck,
    });
}

async function gameOver({ players, deck, playerKeys, lastPlayerKey }) {
    const values = Object.values(players),
        isGameOver =
            // a player is at or below 0 HP
            !!values.find(({ hp }) => hp <= 0) ||
            // or the draw pile is exhausted and
            // the current player has no numbered cards
            (deck.isEmpty() &&
                !getNumbered(
                    players[getCurrentPlayerKey({ playerKeys, lastPlayerKey })]
                        .cards
                ).length);
    if (isGameOver) {
        const hpSorted = values.sort((a, b) => b.hp - a.hp),
            [a, b] = hpSorted,
            { name } =
                // if ending HPs are equal, then it's a tie
                a.hp === b.hp ? {} : values.find(({ hp }) => hp > 0) || a,
            winner = name && (await getUsername(name)),
            message = winner
                ? `Game over! ${winner} won!`
                : "Game over! It's a tie!";
        toggleDisabled({ override: true, lastPlayerKey, playerKeys });
        alert(message);
        const drawPileElem = document.querySelector("#draw-pile");
        drawPileElem.innerHTML = "<p><button>new game</button></p>";
        const newGameBtn = drawPileElem.querySelector("button");
        newGameBtn.onclick = () =>
            handleStartGame({
                playerId1: players[playerKeys[0]].name,
                playerId2: players[playerKeys[1]].name,
            });
        return true;
    }
}

export { startGame };
