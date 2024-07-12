import { getNumbered } from "./misc.js";
import {
    cpu,
    getGame,
    getPlayersFromGameData,
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
import { setHandlers, autoMove } from "./handlers.js";
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
        const { gameId, game, playerIds } = verified,
            { turn } = game,
            { deck, players } = getPlayersAndDeck({ game, playerIds }),
            isAuto = playerIds.includes(cpu),
            isOpponentStart = turn !== user.email,
            // first call of displayPlayers() will toggle
            // lastPlayerId to whoever's turn it isn't
            state = { lastPlayerId: turn };
        displayNames({ playerIds, players });
        await displayPlayers();
        setHandlers({
            playerIds,
            players,
            displayPlayers,
            isAuto,
            state,
        });
        if (isOpponentStart) {
            toggleDisabled({ override: true });
            autoMove({
                isAuto,
                lastPlayerId: state.lastPlayerId,
                playerIds,
                players,
                displayPlayers,
            });
        }
        document.querySelector("#hide-before-load").style.display = "block";

        async function displayPlayers() {
            displayPlayerHpAndCards({ playerIds, players, user });
            displayDrawPileCount(deck);
            let { lastPlayerId } = state;
            await displayRecentMoves({ playerIds, lastPlayerId, players });
            state.lastPlayerId = getCurrentPlayerKey({
                playerIds,
                lastPlayerId,
            });
            ({ lastPlayerId } = state);
            toggleDisabled({ override: false, lastPlayerId, playerIds });
            const { name: turn } =
                players[getCurrentPlayerKey({ playerIds, lastPlayerId })];
            await update({
                gameId,
                players,
                playerIds,
                deck,
                turn,
            });
            return await gameOver({ players, deck, playerIds, lastPlayerId });
        }
    }
}

async function verifyGame(user) {
    const gameId = getSearchParam("id"),
        game = await getGame(gameId);
    let playerIds = getPlayersFromGameData(game);
    if (playerIds.includes(user.email)) {
        playerIds = [user.email, playerIds.find((id) => id !== user.email)];
        return { gameId, game, playerIds };
    } else {
        alert("You don't have access to this game. Check the URL.");
        window.location.href = window.location.origin;
    }
}

function getSearchParam(param) {
    const params = new URLSearchParams(document.location.search);
    return params.get(param);
}

function getPlayersAndDeck({ game, playerIds }) {
    const deck = new Deck(game.deck),
        players = {
            [playerIds[0]]: new Player({
                name: playerIds[0],
                game: game[playerIds[0]],
                deck,
            }),
            [playerIds[1]]: new Player({
                name: playerIds[1],
                game: game[playerIds[1]],
                deck,
                // is opponent
                isHidden: true,
            }),
        };
    players[playerIds[0]].setOpponent(players[playerIds[1]]);
    players[playerIds[1]].setOpponent(players[playerIds[0]]);
    return { deck, players };
}

async function update({ gameId, players, playerIds, deck, turn }) {
    await updateGame({
        gameId,
        player1: players[playerIds[0]],
        player2: players[playerIds[1]],
        deck,
        turn,
    });
}

async function gameOver({ players, deck, playerIds, lastPlayerId }) {
    const values = Object.values(players),
        isBelowZero = !!values.find(({ hp }) => hp <= 0),
        currentPlayerKey = getCurrentPlayerKey({ playerIds, lastPlayerId }),
        { cards } = players[currentPlayerKey],
        currentPlayerNumbered = getNumbered(cards),
        isGameOver =
            // a player is at or below 0 HP
            isBelowZero ||
            // or the draw pile is exhausted and
            // the current player has no numbered cards
            (deck.isEmpty() && !currentPlayerNumbered.length);
    if (isGameOver) {
        const hpSorted = values.toSorted((a, b) => b.hp - a.hp),
            [a, b] = hpSorted,
            { name } =
                // if ending HPs are equal, then it's a tie
                a.hp === b.hp ? {} : a,
            winner = name && (await getUsername(name)),
            message = winner
                ? `Game over! ${winner} won!`
                : "Game over! It's a tie!";
        toggleDisabled({ override: true, lastPlayerId, playerIds });
        alert(message);
        const drawPileElem = document.querySelector("#draw-pile");
        drawPileElem.innerHTML = "<p><button>new game</button></p>";
        const newGameBtn = drawPileElem.querySelector("button");
        newGameBtn.onclick = () =>
            handleStartGame({
                playerId1: players[playerIds[0]].name,
                playerId2: players[playerIds[1]].name,
            });
        return true;
    }
}

export { startGame };
