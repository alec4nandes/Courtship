import Deck from "./classes/Deck.js";
import Player from "./classes/Player.js";
import { getNumbered, getRank } from "./misc.js";

/*
    Gameplay:
        * create new Deck object
        * pass Deck object to 2 new Player objects
        * set each player as each other's opponent
            * Player.setOpponent(opponent)
        * DOM setup: display elements & add handlers
*/

async function startGame({ player1Name, player2Name, isAuto }) {
    const deck = new Deck(),
        playerKeys = ["player1", "player2"],
        players = {
            [playerKeys[0]]: new Player({ name: player1Name, deck }),
            [playerKeys[1]]: new Player({
                name: player2Name,
                deck,
                isHidden: true,
            }),
        };
    players[playerKeys[0]].setOpponent(players[playerKeys[1]]);
    players[playerKeys[1]].setOpponent(players[playerKeys[0]]);
    // setup DOM
    let lastPlayerKey = playerKeys[0];
    displayPlayers();
    // set handlers
    for (const playerKey of playerKeys) {
        const player = players[playerKey],
            formElem = document.querySelector(`#${playerKey}`),
            drawBtn = formElem.querySelector(".draw-card");
        formElem.onsubmit = (e) => handleSubmitPlay({ e, player });
        formElem.querySelector(".name").innerHTML = `<p>${player.name}</p>`;
        drawBtn &&
            (drawBtn.onclick = (e) => handleClickDrawCard({ e, player }));
    }

    function displayPlayers() {
        displayDrawPileCount();
        for (const playerKey of playerKeys) {
            const player = players[playerKey];
            document.querySelector(
                `#${playerKey} .score`
            ).innerHTML = `<p>${player.hp}</p>`;
            document.querySelector(`#${playerKey} .inputs`).innerHTML = player
                .getCards()
                ?.map(
                    (card) => `
                            <label>
                                <input type="checkbox" value="${card}"/>
                                ${card}
                            </label>
                        `
                )
                .join("");
        }
        lastPlayerKey = getCurrentPlayerKey();
    }

    function displayDrawPileCount() {
        document.querySelector("#draw-pile").innerHTML = `
            <p>
                ${deck.deck.length} cards left in draw pile.
                ${displayRecentMoves()}
            </p>
        `;
    }

    function displayRecentMoves() {
        const currentPlayer = players[getCurrentPlayerKey()],
            otherName = currentPlayer.name,
            otherHand = sortHand(currentPlayer).join(", "),
            otherPoints = currentPlayer.points,
            lastPlayer = players[lastPlayerKey],
            lastPlayerName = lastPlayer.name,
            lastPlayerHand = sortHand(lastPlayer).join(", ");
        return (
            (otherHand
                ? `
                    <br/>${otherName} just played: ${otherHand}
                    <br/><strong>${otherPoints}</strong>
                `
                : "") +
            (lastPlayerHand
                ? `
                    <br/><em>
                        (before that, ${lastPlayerName}
                        played ${lastPlayerHand})
                    </em>
                `
                : "")
        );
    }

    function getCurrentPlayerKey() {
        return playerKeys.find((playerKey) => playerKey !== lastPlayerKey);
    }

    function sortHand(player) {
        const court = player.getCourt(),
            numbered =
                getNumbered({ hand: player.hand, court })?.sort(
                    (a, b) => getRank(b) - getRank(a)
                ) || [];
        return [court, ...numbered].filter(Boolean);
    }

    function handleSubmitPlay({ e, player }) {
        e.preventDefault();
        const hand = [...e.target.querySelectorAll(`input[type="checkbox"]`)]
            .filter(({ checked }) => checked)
            .map(({ value }) => value);
        const isSuccess = player.setHand(hand);
        isSuccess && displayPlayers();
        isAuto && autoMove();
    }

    function handleClickDrawCard({ e, player }) {
        e.preventDefault();
        player.drawSingleCardForTurn();
        displayPlayers();
        isAuto && autoMove();
    }

    function autoMove() {
        if (lastPlayerKey === playerKeys[0]) {
            setTimeout(() => {
                players[getCurrentPlayerKey()].autoMove();
                displayPlayers();
            }, 3000);
        }
    }
}

export { startGame };
