// CLASSES

class Deck {
    constructor() {
        const numbered = new Array(10)
                .fill(1)
                .map((n, i) => (i ? n + i : "Ace")),
            courts = ["Jack", "Queen", "King"],
            ranks = [...numbered, ...courts],
            suits = ["Hearts", "Spades", "Diamonds", "Clubs"],
            deck = suits
                .map((suit) => ranks.map((rank) => `${rank} of ${suit}`))
                .flat(Infinity);
        this.deck = deck;
    }

    drawCard() {
        const randomIndex = ~~(Math.random() * this.deck.length),
            card = this.deck[randomIndex];
        this.deck.splice(randomIndex, 1);
        return card;
    }

    firstDeal() {
        const hand = [];
        while (hand.length < 5) {
            hand.push(this.drawCard());
        }
        return hand;
    }

    getDeck() {
        return this.deck;
    }
}

class Player {
    constructor({ name, deck }) {
        this.name = name;
        this.deck = deck;
        this.cards = deck.firstDeal();
        this.hp = 200;
    }

    getName() {
        return this.name;
    }

    setOpponent(player) {
        this.opponent = player;
    }

    getCards() {
        return this.cards;
    }

    setCards(cards) {
        this.cards = cards;
    }

    drawCard() {
        this.cards.push(this.deck.drawCard());
    }

    drawSingleCardForTurn() {
        this.drawCard();
        // strategic matching of court's suit played
        // on previous turn doesn't apply anymore,
        // therefore reset hands
        this.setHand(null);
        this.opponent.setHand(null);
    }

    getHand() {
        return this.hand;
    }

    setHand(hand) {
        this.hand = null;
        if (this.validateHand(hand)) {
            this.hand = hand;
            this.setCards(this.cards.filter((card) => !hand.includes(card)));
            while (this.cards.length < 5) {
                this.drawCard();
            }
        }
    }

    validateHand(hand) {
        if (!hand) {
            return;
        }
        if (!hand.length) {
            alert("Please select some cards.");
            return false;
        }
        const courts = getCourts(hand);
        if (courts.length > 1) {
            alert("Can only play one court card on each turn.");
            return false;
        }
        const court = courts[0],
            numbered = getNumbered({ hand, court });
        if (
            Object.entries({ Jack: 2, Queen: 3, King: 4 }).find(
                ([rank, count]) =>
                    this.courtIsInvalid({ rank, count, court, numbered })
            )
        ) {
            return false;
        } else if (!court && numbered.length !== 1) {
            alert("Can only play one card without a court card.");
            return false;
        }
        if (
            numbered.find((card) => getSuit(card) === "Hearts") &&
            !this.isRecovery(numbered)
        ) {
            alert(
                "Numbered cards must be all hearts " +
                    "OR a combination of the other suits."
            );
            return false;
        }
        console.log(courts, numbered);
        return true;
    }

    courtIsInvalid({ court, rank, numbered, count }) {
        if (court?.includes(rank) && numbered.length !== count) {
            alert(`A ${rank} must accompany ${count} cards.`);
            return true;
        }
    }

    isRecovery(numbered) {
        const suits = new Set(numbered.map(getSuit));
        return suits.has("Hearts") && suits.size === 1;
    }

    playHand() {
        if (!this.hand) {
            return false;
        }
        const numbered = getNumbered({
                hand: this.hand,
                court: this.getCourt(),
            }),
            isRecovery = this.isRecovery(numbered),
            basePoints = this.getBasePoints(numbered),
            factor = this.getFactor(),
            points = (isRecovery ? 1 : -1) * (basePoints * factor);
        this.setPoints(`${isRecovery ? "RECOVER" : "ATTACK"} ${points}`);
        console.log();
        isRecovery ? this.setHP(points) : this.opponent.setHP(points);
        return true;
    }

    getCourt() {
        return getCourts(this.hand)?.[0];
    }

    getBasePoints(numbered) {
        const opponentCourt = this.opponent.getCourt(),
            opponentCourtSuit = getSuit(opponentCourt);
        return numbered
            .map((card) => {
                const suit = getSuit(card),
                    rank = getRank(card);
                return rank * (suit === opponentCourtSuit ? 2 : 1);
            })
            .reduce((acc, num) => acc + num, 0);
    }

    getFactor() {
        const opponentCourt = this.opponent.getCourt(),
            opponentCourtSuit = getSuit(opponentCourt),
            courtSuit = getSuit(this.getCourt()),
            factor =
                courtSuit &&
                opponentCourtSuit &&
                courtSuit === opponentCourtSuit
                    ? 2
                    : 1;
        return factor;
    }

    getHP() {
        return this.hp;
    }

    setHP(points) {
        this.hp += points;
    }

    getPoints() {
        return this.points;
    }

    setPoints(points) {
        this.points = points;
    }
}

// GLOBAL FUNCTIONS

function getRank(card) {
    const rank = card?.split(" ")[0];
    return rank === "Ace" ? 1 : isNaN(rank) ? rank : +rank;
}

function getSuit(card) {
    return card?.split(" ").at(-1);
}

function getCourts(hand) {
    return hand?.filter((card) =>
        ["Jack", "Queen", "King"].includes(getRank(card))
    );
}

function getNumbered({ hand, court }) {
    return hand?.filter((card) => card !== court);
}

// START GAME

startGame({ player1Name: "Alec", player2Name: "CPU" });

function startGame({ player1Name, player2Name }) {
    const deck = new Deck(),
        players = {
            player1: new Player({ name: player1Name, deck }),
            player2: new Player({ name: player2Name, deck }),
        };
    players.player1.setOpponent(players.player2);
    players.player2.setOpponent(players.player1);
    // setup DOM
    let currentPlayer = "player1";
    displayPlayers();
    // set handlers
    for (const p of ["player1", "player2"]) {
        const player = players[p],
            formElem = document.querySelector(`#${p}`);
        formElem.onsubmit = (e) => handleSubmitPlay({ e, player });
        formElem.querySelector(
            ".name"
        ).innerHTML = `<p>${player.getName()}</p>`;
        formElem.querySelector(".draw-card").onclick = (e) =>
            handleClickDrawCard({ e, player });
    }

    function displayPlayers() {
        displayDrawPileCount();
        for (const p of ["player1", "player2"]) {
            const player = players[p];
            document.querySelector(`#${p} .inputs`).innerHTML =
                player
                    .getCards()
                    .map(
                        (card) => `
                            <label>
                                <input type="checkbox" value="${card}"/>
                                ${card}
                            </label>
                        `
                    )
                    .join("") + `<p>${player.getHP()}</p>`;
        }
        const otherPlayer = getOtherPlayer();
        toggleFormDisabled(currentPlayer);
        toggleFormDisabled(otherPlayer);
        currentPlayer = otherPlayer;
    }

    function getOtherPlayer() {
        return ["player1", "player2"].find((p) => p !== currentPlayer);
    }

    function displayDrawPileCount() {
        const otherPlayer = players[getOtherPlayer()],
            otherName = otherPlayer.getName(),
            otherHand = sortHand(otherPlayer),
            otherPoints = otherPlayer.getPoints(),
            player = players[currentPlayer],
            playerName = player.getName(),
            playerHand = sortHand(player);
        document.querySelector("#draw-pile").innerHTML =
            `${deck.getDeck().length} cards left in draw pile.` +
            (otherHand.length
                ? `<br/>${otherName} just played: ${otherHand.join(
                      ", "
                  )}<br/><strong>${otherPoints}</strong>`
                : "") +
            (playerHand.length
                ? `<br/><em>(before that, ${playerName} played ${playerHand.join(
                      ", "
                  )})</em>`
                : "");
    }

    function sortHand(player) {
        const court = player.getCourt(),
            numbered =
                getNumbered({ hand: player.getHand(), court })?.sort(
                    (a, b) => getRank(b) - getRank(a)
                ) || [];
        return [court, ...numbered].filter(Boolean);
    }

    function toggleFormDisabled(p) {
        [
            ...document
                .querySelector(`#${p}`)
                .querySelectorAll("button, input"),
        ].forEach((elem) => (elem.disabled = p !== currentPlayer));
    }

    function handleSubmitPlay({ e, player }) {
        e.preventDefault();
        const hand = [...e.target.querySelectorAll(`input[type="checkbox"]`)]
            .filter(({ checked }) => checked)
            .map(({ value }) => value);
        player.setHand(hand);
        player.playHand() && displayPlayers();
    }

    function handleClickDrawCard({ e, player }) {
        e.preventDefault();
        player.drawSingleCardForTurn();
        displayPlayers();
    }
}
