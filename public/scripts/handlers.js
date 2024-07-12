import { getCurrentPlayerKey } from "./display.js";

function setHandlers({
    playerIds,
    players,
    displayAndCheckGameOver,
    isAuto,
    state,
}) {
    const formElem = document.querySelector(`#player`),
        drawCardBtn = document.querySelector("#draw-card"),
        player = players[playerIds[0]],
        params = {
            player,
            displayAndCheckGameOver,
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
    displayAndCheckGameOver,
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
        const isGameOver = await displayAndCheckGameOver();
        !isGameOver &&
            autoMove({
                isAuto,
                state,
                playerIds,
                players,
                displayAndCheckGameOver,
            });
    }
}

async function handleClickDrawCard({
    e,
    player,
    displayAndCheckGameOver,
    isAuto,
    state,
    playerIds,
    players,
}) {
    e.preventDefault();
    if (player.drawSingleCardForTurn()) {
        const isGameOver = await displayAndCheckGameOver();
        !isGameOver &&
            autoMove({
                isAuto,
                state,
                playerIds,
                players,
                displayAndCheckGameOver,
            });
    }
}

function autoMove({
    isAuto,
    state,
    playerIds,
    players,
    displayAndCheckGameOver,
}) {
    const { lastPlayerId } = state;
    if (isAuto && lastPlayerId === playerIds[0]) {
        setTimeout(async () => {
            players[
                getCurrentPlayerKey({ playerIds, lastPlayerId })
            ].autoMove();
            await displayAndCheckGameOver();
        }, 3000);
    }
}

export { setHandlers, autoMove };
