import { getCurrentPlayerKey } from "./database.js";

function setHandlers({
    playerKeys,
    players,
    displayPlayers,
    isAuto,
    lastPlayerKey,
}) {
    const userKey = playerKeys[0],
        formElem = document.querySelector(`#${userKey}`),
        drawCardBtn = document.querySelector("#draw-card"),
        player = players[userKey],
        params = {
            player,
            displayPlayers,
            isAuto,
            lastPlayerKey,
            playerKeys,
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
    lastPlayerKey,
    playerKeys,
    players,
}) {
    e.preventDefault();
    const hand = [...e.target.querySelectorAll(`input[type="checkbox"]`)]
        .filter(({ checked }) => checked)
        .map(({ value }) => value);
    const isSuccess = player.setHand(hand);
    if (isSuccess) {
        const isGameOver = await displayPlayers();
        !isGameOver && autoMove({ isAuto, lastPlayerKey, playerKeys, players });
    }
}

async function handleClickDrawCard({
    e,
    player,
    displayPlayers,
    isAuto,
    lastPlayerKey,
    playerKeys,
    players,
}) {
    e.preventDefault();
    if (player.drawSingleCardForTurn()) {
        const isGameOver = await displayPlayers();
        !isGameOver && autoMove({ isAuto, lastPlayerKey, playerKeys, players });
    }
}

function autoMove({ isAuto, lastPlayerKey, playerKeys, players }) {
    if (isAuto && lastPlayerKey === playerKeys[0]) {
        setTimeout(async () => {
            players[
                getCurrentPlayerKey({ playerKeys, lastPlayerKey })
            ].autoMove();
            await displayPlayers();
        }, 3000);
    }
}

export { setHandlers };
