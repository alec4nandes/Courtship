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
    // set names
    for (const playerKey of playerKeys) {
        const nameElem = document.querySelector(`#${playerKey} .stats .name`);
        nameElem.innerHTML = `<h2>${players[playerKey].name}</h2>`;
    }
    // setup DOM
    let lastPlayerKey = playerKeys[0];
    displayPlayers();
    // set handlers
    const userKey = playerKeys[0],
        formElem = document.querySelector(`#${userKey}`),
        drawCardBtn = document.querySelector("#draw-card"),
        user = players[userKey];
    formElem.onsubmit = (e) => handleSubmitPlay({ e, player: user });
    drawCardBtn.onclick = (e) => handleClickDrawCard({ e, player: user });

    function displayPlayers() {
        displayPlayerHpAndCards();
        displayDrawPileCount();
        displayRecentMoves();
        lastPlayerKey = getCurrentPlayerKey();
        toggleDisabled({ override: false });
    }

    function displayPlayerHpAndCards() {
        for (const playerKey of playerKeys) {
            const player = players[playerKey],
                scoreElem = document.querySelector(
                    `#${playerKey} .stats .score`
                ),
                cardsElem = document.querySelector(
                    `#${playerKey} .play .cards`
                );
            scoreElem.innerHTML = `<h2>${player.hp}</h2>`;
            cardsElem.innerHTML = player
                .getCards()
                .map(makePlayerCard)
                .join("");
        }
    }

    function makePlayerCard(card) {
        return card
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
            `;
    }

    function displayDrawPileCount() {
        const drawPileElem = document.querySelector("#draw-pile");
        drawPileElem.innerHTML = `<p>${deck.deck.length} cards left in draw pile.</p>`;
    }

    function displayRecentMoves() {
        const currentPlayerKey = getCurrentPlayerKey(),
            currentPlayer = players[currentPlayerKey],
            currentPlayerHand = sortHand(currentPlayer),
            lastPlayer = players[lastPlayerKey],
            lastPlayerHand = sortHand(lastPlayer);
        const currentPlayerCardsElem = document.querySelector(
                `#${currentPlayerKey} .played .cards`
            ),
            lastPlayerCardsElem = document.querySelector(
                `#${lastPlayerKey} .played .cards`
            );
        currentPlayerCardsElem.innerHTML = makePlayedCards({
            cards: currentPlayerHand,
            key: currentPlayerKey,
        });
        lastPlayerCardsElem.innerHTML = makePlayedCards({
            cards: lastPlayerHand,
            key: lastPlayerKey,
        });
    }

    function getCurrentPlayerKey() {
        return playerKeys.find((playerKey) => playerKey !== lastPlayerKey);
    }

    function sortHand(player) {
        const court = player.getCourt(),
            numbered = getNumbered(player.hand.cards).sort(
                (a, b) => getRank(b) - getRank(a)
            );
        return [court, ...numbered].filter(Boolean);
    }

    function makePlayedCards({ cards, key }) {
        const html = cards
                .map((card) => `<div class="card">${getCardImg(card)}</div>`)
                .join(""),
            { hand, name } = players[key],
            { points, hasNotStarted } = hand,
            text = `
                    <p class="played-text">
                        <em>
                        ${
                            points
                                ? `
                                    ${name}'s last hand:
                                    <strong>
                                        ${points > 0 ? "RECOVER" : "ATTACK"}
                                        ${points}
                                    </strong>
                                `
                                : hasNotStarted
                                ? `${name} hasn't yet played a hand.`
                                : `${name} drew a card last turn.`
                        }
                        </em>
                    </p>
                `,
            isTextTop = key === playerKeys[1];
        return isTextTop ? text + html : html + text;
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
        gameOver() || (isAuto && autoMove());
    }

    function gameOver() {
        const message = playerKeys
            .map((playerKey) => players[playerKey].gameOverMessage)
            .find((message) => message);
        if (message) {
            toggleDisabled({ override: true });
            setTimeout(() => {
                alert(message);
                const drawPileElem = document.querySelector("#draw-pile");
                drawPileElem.innerHTML = "<p><button>new game</button></p>";
                const newGameBtn = document.querySelector("#draw-pile button");
                newGameBtn.onclick = () => window.location.reload();
            }, 1000);
            return true;
        }
    }

    function toggleDisabled({ override }) {
        const isOpponentTurn = override || lastPlayerKey === playerKeys[0],
            checkboxElems = [
                ...document.querySelectorAll(
                    `#${playerKeys[0]} input[type="checkbox"]`
                ),
            ];
        checkboxElems.forEach((elem) => (elem.disabled = isOpponentTurn));
        document.querySelector("#draw-card").disabled = isOpponentTurn;
        document.querySelector("#submit").disabled = isOpponentTurn;
    }

    function autoMove() {
        if (lastPlayerKey === playerKeys[0]) {
            setTimeout(() => {
                players[getCurrentPlayerKey()].autoMove();
                displayPlayers();
                gameOver();
            }, 3000);
        }
    }

    function handleClickDrawCard({ e, player }) {
        e.preventDefault();
        player.drawSingleCardForTurn();
        displayPlayers();
        isAuto && autoMove();
    }
}

export { startGame };
