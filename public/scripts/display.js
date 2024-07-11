import { getNumbered, getRank } from "./misc.js";
import { getUsername } from "./user-games.js";

async function displayNames({ playerKeys, players }) {
    for (const playerKey of playerKeys) {
        const nameElem = document.querySelector(`#${playerKey} .stats .name`);
        // TODO: get username
        nameElem.innerHTML = `
            <h2>
                ${await getUsername(players[playerKey].name)}
            </h2>
        `;
    }
}

function displayPlayerHpAndCards({ playerKeys, players, user }) {
    for (const playerKey of playerKeys) {
        const player = players[playerKey],
            scoreElem = document.querySelector(`#${playerKey} .stats .score`),
            cardsElem = document.querySelector(`#${playerKey} .play .cards`);
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

async function displayRecentMoves({ playerKeys, lastPlayerKey, players }) {
    const currentPlayerKey = getCurrentPlayerKey({ playerKeys, lastPlayerKey }),
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
        players,
        key: currentPlayerKey,
        playerKeys,
    });
    lastPlayerCardsElem.innerHTML = await makePlayedCards({
        cards: lastPlayerHand,
        players,
        key: lastPlayerKey,
        playerKeys,
    });
}

function getCurrentPlayerKey({ playerKeys, lastPlayerKey }) {
    return playerKeys.find((playerKey) => playerKey !== lastPlayerKey);
}

function sortHand(player) {
    const court = player.getCourt(),
        numbered = getNumbered(player.hand.cards).sort(
            (a, b) => getRank(b) - getRank(a)
        );
    return [court, ...numbered].filter(Boolean);
}

async function makePlayedCards({ cards, players, key, playerKeys }) {
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

function toggleDisabled({ override, lastPlayerKey, playerKeys }) {
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

export {
    displayNames,
    displayPlayerHpAndCards,
    displayDrawPileCount,
    displayRecentMoves,
    getCurrentPlayerKey,
    toggleDisabled,
};
