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
        playerKeys = ["player", "opponent"],
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
            drawBtn = formElem.querySelector("#draw-card");
        formElem.onsubmit = (e) => handleSubmitPlay({ e, player });
        formElem.querySelector(
            `#${playerKey} .stats .name`
        ).innerHTML = `<h2>${player.name}</h2>`;
        drawBtn &&
            (drawBtn.onclick = (e) => handleClickDrawCard({ e, player }));
    }

    function displayPlayers() {
        displayDrawPileCount();
        for (const playerKey of playerKeys) {
            const player = players[playerKey];
            document.querySelector(
                `#${playerKey} .stats .score`
            ).innerHTML = `<h2>${player.hp}</h2>`;
            document.querySelector(`#${playerKey} .play .cards`).innerHTML =
                player
                    .getCards()
                    .map((card) =>
                        card
                            ? `
                                <label class="card">
                                    <input type="checkbox" value="${card}"/>
                                    ${getCardImg(card)}
                                </label>
                            `
                            : `
                                <div class="card">
                                    <img src="/assets/kings-corner-card-back-min.png" />
                                </div>
                            `
                    )
                    .join("");
        }
        lastPlayerKey = getCurrentPlayerKey();
        toggleDisabled();
    }

    function displayDrawPileCount() {
        document.querySelector(
            "#draw-pile"
        ).innerHTML = `<p>${deck.deck.length} cards left in draw pile.</p>`;
        displayRecentMoves();
    }

    function displayRecentMoves() {
        const currentPlayerKey = getCurrentPlayerKey(),
            currentPlayer = players[currentPlayerKey],
            currentPlayerHand = sortHand(currentPlayer),
            lastPlayer = players[lastPlayerKey],
            lastPlayerHand = sortHand(lastPlayer),
            makePlayedCards = ({ cards, key }) => {
                const html = cards
                        .map(
                            (card) =>
                                `<div class="card">${getCardImg(card)}</div>`
                        )
                        .join(""),
                    text = cards.length
                        ? `
                            <p class="played-text">
                                <em>
                                    Played Last Turn:
                                    <strong>${players[key].points}</strong>
                                </em>
                            </p>
                        `
                        : "",
                    isTextTop = key === playerKeys[1];
                return isTextTop ? text + html : html + text;
            };
        document.querySelector(
            `#${currentPlayerKey} .played .cards`
        ).innerHTML = makePlayedCards({
            cards: currentPlayerHand,
            key: currentPlayerKey,
        });
        document.querySelector(`#${lastPlayerKey} .played .cards`).innerHTML =
            makePlayedCards({ cards: lastPlayerHand, key: lastPlayerKey });
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

    function getCardImg(card) {
        return `<img src="/assets/cards/${getCardFileName(card)}" />`;
    }

    function getCardFileName(card) {
        return card.replaceAll(" ", "_").toLowerCase() + "-min.jpg";
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

    function toggleDisabled() {
        const isOpponentTurn = lastPlayerKey === playerKeys[0];
        document.querySelector("#draw-card").disabled = isOpponentTurn;
        document.querySelector("#submit").disabled = isOpponentTurn;
        [
            ...document.querySelectorAll(
                `#${playerKeys[0]} input[type="checkbox"]`
            ),
        ].forEach((elem) => (elem.disabled = isOpponentTurn));
    }
}

export { startGame };
