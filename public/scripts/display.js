import { getNumbered, getRank } from "./misc.js";
import { getUsername } from "./user-games.js";

async function displayNames({ playerIds, players }) {
    for (let i = 0; i < playerIds.length; i++) {
        const nameElem = document.querySelector(
                `#${getClassName(i)} .stats .name`
            ),
            playerId = playerIds[i];
        // TODO: get username
        nameElem.innerHTML = `
            <h2>
                ${await getUsername(players[playerId].name)}
            </h2>
        `;
    }
}

function getClassName(i) {
    const isOpponent = !!i;
    return isOpponent ? "opponent" : "player";
}

function displayPlayerHpAndCards({ playerIds, players, user }) {
    for (let i = 0; i < playerIds.length; i++) {
        const playerId = playerIds[i],
            player = players[playerId],
            scoreElem = document.querySelector(
                `#${getClassName(i)} .stats .score`
            ),
            cardsElem = document.querySelector(
                `#${getClassName(i)} .play .cards`
            );
        scoreElem.innerHTML = `<h2>${player.hp}</h2>`;
        cardsElem.innerHTML = player.cards
            .map((card) => makePlayerCard({ id: player.name, user, card }))
            .join("");
    }
}

function makePlayerCard({ id, user, card }) {
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

function displayDrawPileCount(deck) {
    const drawPileElem = document.querySelector("#draw-pile");
    drawPileElem.innerHTML = `<p>${deck.cards.length} cards left in draw pile.</p>`;
}

async function displayRecentMoves({ playerIds, lastPlayerId, players }) {
    const currentPlayerKey = getCurrentPlayerKey({ playerIds, lastPlayerId }),
        currentPlayer = players[currentPlayerKey],
        currentPlayerHand = sortHand(currentPlayer),
        lastPlayer = players[lastPlayerId],
        lastPlayerHand = sortHand(lastPlayer),
        currentIsOpponent = currentPlayerKey == playerIds[1],
        currentPlayerCardsElem = document.querySelector(
            `#${currentIsOpponent ? "opponent" : "player"} .played .cards`
        ),
        lastPlayerCardsElem = document.querySelector(
            `#${currentIsOpponent ? "player" : "opponent"} .played .cards`
        );
    currentPlayerCardsElem.innerHTML = await makePlayedCards({
        cards: currentPlayerHand,
        players,
        key: currentPlayerKey,
        playerIds,
    });
    lastPlayerCardsElem.innerHTML = await makePlayedCards({
        cards: lastPlayerHand,
        players,
        key: lastPlayerId,
        playerIds,
    });
}

function getCurrentPlayerKey({ playerIds, lastPlayerId }) {
    return playerIds.find((playerKey) => playerKey !== lastPlayerId);
}

function sortHand(player) {
    const court = player.getCourt(),
        numbered = getNumbered(player.hand.cards).sort(
            (a, b) => getRank(b) - getRank(a)
        );
    return [court, ...numbered].filter(Boolean);
}

async function makePlayedCards({ cards, players, key, playerIds }) {
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
        isTextTop = key === playerIds[1];
    return isTextTop ? text + html : html + text;
}

function getCardImg(card) {
    return `<img src="/assets/cards/${getCardFileName(card)}" />`;
}

function getCardFileName(card) {
    return card.replaceAll(" ", "_").toLowerCase() + "-min.jpg";
}

function toggleDisabled({ override, lastPlayerId, playerIds }) {
    const isOpponentTurn = override || lastPlayerId === playerIds[0],
        checkboxElems = [
            ...document.querySelectorAll(`#player input[type="checkbox"]`),
        ];
    checkboxElems.forEach((elem) => (elem.disabled = isOpponentTurn));
    document.querySelector("#draw-card").disabled = isOpponentTurn;
    document.querySelector("#submit").disabled = isOpponentTurn;
}

export {
    displayNames,
    displayPlayerHpAndCards,
    displayDrawPileCount,
    displayRecentMoves,
    getCurrentPlayerKey,
    toggleDisabled,
};
