import { getCurrentPlayerKey } from "./display.js";

function setHandlers({ playerIds, players, displayPlayers, isAuto, state }) {
    const formElem = document.querySelector(`#player`),
        drawCardBtn = document.querySelector("#draw-card"),
        player = players[playerIds[0]],
        params = {
            player,
            displayPlayers,
            isAuto,
            state,
            playerIds,
            players,
        };
    formElem.onsubmit = (e) => handleSubmitPlay({ e, ...params });
    drawCardBtn.onclick = (e) => handleClickDrawCard({ e, ...params });
}

async function handleSubmitPlay({
    e,
    player,
    displayPlayers,
    isAuto,
    state,
    playerIds,
    players,
}) {
    e.preventDefault();
    const hand = [...e.target.querySelectorAll(`input[type="checkbox"]`)]
        .filter(({ checked }) => checked)
        .map(({ value }) => value);
    const isSuccess = player.setHand(hand);
    if (isSuccess) {
        const isGameOver = await displayPlayers(),
            { lastPlayerId } = state;
        !isGameOver &&
            autoMove({
                isAuto,
                lastPlayerId,
                playerIds,
                players,
                displayPlayers,
            });
    }
}

async function handleClickDrawCard({
    e,
    player,
    displayPlayers,
    isAuto,
    state,
    playerIds,
    players,
}) {
    e.preventDefault();
    if (player.drawSingleCardForTurn()) {
        const isGameOver = await displayPlayers(),
            { lastPlayerId } = state;
        !isGameOver &&
            autoMove({
                isAuto,
                lastPlayerId,
                playerIds,
                players,
                displayPlayers,
            });
    }
}

function autoMove({
    isAuto,
    lastPlayerId,
    playerIds,
    players,
    displayPlayers,
}) {
    if (isAuto && lastPlayerId === playerIds[0]) {
        setTimeout(async () => {
            players[
                getCurrentPlayerKey({ playerIds, lastPlayerId })
            ].autoMove();
            await displayPlayers();
        }, 3000);
    }
}

export { setHandlers, autoMove };
