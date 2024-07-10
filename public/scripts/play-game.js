import { getNumbered, getRank } from "./misc.js";
import {
    cpu,
    getGame,
    getUsername,
    handleStartGame,
    updateGame,
} from "./user-games.js";
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

function getSearchParam(param) {
    const params = new URLSearchParams(document.location.search);
    return params.get(param);
}

async function startGame(user) {
    const id = getSearchParam("id"),
        game = await getGame(id);
    let ids = Object.keys(game).filter((key) => key !== "deck"),
        deck,
        players;
    const isAuto = ids.includes(cpu),
        playerKeys = ["player", "opponent"];
    if (ids.includes(user.email)) {
        ids = [user.email, ids.find((id) => id !== user.email)];
        deck = new Deck(game.deck);
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
        document.querySelector("#hide-before-load").style.display = "block";
    } else {
        alert("You don't have access to this game. Check the URL.");
        window.location.href = window.location.origin;
    }

    // set names
    for (const playerKey of playerKeys) {
        const nameElem = document.querySelector(`#${playerKey} .stats .name`);
        // TODO: get username
        nameElem.innerHTML = `
            <h2>
                ${await getUsername(players[playerKey].name)}
            </h2>
        `;
    }
    // setup DOM
    let lastPlayerKey = playerKeys[0];
    await displayPlayers();
    // set handlers
    const userKey = playerKeys[0],
        formElem = document.querySelector(`#${userKey}`),
        drawCardBtn = document.querySelector("#draw-card"),
        player = players[userKey];
    formElem.onsubmit = (e) => handleSubmitPlay({ e, player });
    drawCardBtn.onclick = (e) => handleClickDrawCard({ e, player });

    async function displayPlayers() {
        displayPlayerHpAndCards();
        displayDrawPileCount();
        await displayRecentMoves();
        lastPlayerKey = getCurrentPlayerKey();
        toggleDisabled({ override: false });
        await update();
        return await gameOver();
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
            cardsElem.innerHTML = player.cards
                .map((card) => makePlayerCard({ card, id: player.name }))
                .join("");
        }
    }

    function makePlayerCard({ card, id }) {
        return id === user.email
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
        drawPileElem.innerHTML = `<p>${deck.cards.length} cards left in draw pile.</p>`;
    }

    async function displayRecentMoves() {
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
        currentPlayerCardsElem.innerHTML = await makePlayedCards({
            cards: currentPlayerHand,
            key: currentPlayerKey,
        });
        lastPlayerCardsElem.innerHTML = await makePlayedCards({
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

    async function makePlayedCards({ cards, key }) {
        const html = cards
                .map((card) => `<div class="card">${getCardImg(card)}</div>`)
                .join(""),
            { hand, name } = players[key],
            { points, hasNotStarted } = hand,
            username = await getUsername(name),
            text = `
                    <p class="played-text">
                        <em>
                        ${
                            points
                                ? `
                                    ${username}'s last hand:
                                    <strong>
                                        ${points > 0 ? "RECOVER" : "ATTACK"}
                                        ${points}
                                    </strong>
                                `
                                : hasNotStarted
                                ? `${username} hasn't yet played a hand.`
                                : `${username} drew a card last turn.`
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

    async function handleSubmitPlay({ e, player }) {
        e.preventDefault();
        const hand = [...e.target.querySelectorAll(`input[type="checkbox"]`)]
            .filter(({ checked }) => checked)
            .map(({ value }) => value);
        const isSuccess = player.setHand(hand);
        if (isSuccess) {
            const isGameOver = await displayPlayers();
            !isGameOver && isAuto && autoMove();
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

    async function update() {
        await updateGame({
            id,
            player1: players[playerKeys[0]],
            player2: players[playerKeys[1]],
            deck,
        });
    }

    async function gameOver() {
        const values = Object.values(players),
            isGameOver =
                // a player is at or below 0 HP
                !!values.find(({ hp }) => hp <= 0) ||
                // or the draw pile is exhausted and
                // the current player has no numbered cards
                (deck.isEmpty() &&
                    !getNumbered(players[getCurrentPlayerKey()].cards).length);
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
            toggleDisabled({ override: true });
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

    function autoMove() {
        if (lastPlayerKey === playerKeys[0]) {
            setTimeout(async () => {
                players[getCurrentPlayerKey()].autoMove();
                await displayPlayers();
            }, 3000);
        }
    }

    async function handleClickDrawCard({ e, player }) {
        e.preventDefault();
        if (player.drawSingleCardForTurn()) {
            const isGameOver = await displayPlayers();
            !isGameOver && isAuto && autoMove();
        }
    }
}

export { startGame };
