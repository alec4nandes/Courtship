import { getCourts, getNumbered, getRank, getSuit } from "../misc.js";

export default class Player {
    #courtCounts = { Jack: 2, Queen: 3, King: 4 };
    #cards;
    #isHidden;

    constructor({ name, deck, isHidden }) {
        this.name = name;
        this.deck = deck;
        this.hp = 60;
        this.#cards = deck.firstDeal();
        this.#isHidden = isHidden;
    }

    setOpponent(player) {
        this.opponent = player;
    }

    /*
        Flow:
            * player picks cards to play from UI
            * cards are set as player's hand (Player.setHand())
            * if valid hand, Player.setHand() returns true and DOM updates
    */

    getCards() {
        return this.#isHidden ? [] : this.#cards;
    }

    #drawCard() {
        !this.deck.isEmpty() &&
            (this.#cards = [...this.#cards, this.deck.drawCard()]);
    }

    drawSingleCardForTurn() {
        this.#drawCard();
        // strategic matching of court's suit played
        // on previous turn doesn't apply anymore,
        // therefore reset both hands
        this.setHand(null);
        this.opponent.setHand(null);
    }

    autoMove() {
        // TODO: remove line:
        this.#isHidden && console.log(this.#cards);
        const sortNumRanksDescending = (a, b) => getRank(b) - getRank(a),
            courts = getCourts(this.#cards),
            numbered = this.#cards
                .filter((card) => !courts.includes(card))
                .sort(sortNumRanksDescending),
            filterer = ({ isRecovery, count }) =>
                numbered
                    .filter((card) => {
                        const result = getSuit(card) === "Hearts";
                        return isRecovery ? result : !result;
                    })
                    .slice(0, count),
            hands = [];
        if (numbered.length / courts.length < 0.3) {
            this.drawSingleCardForTurn();
            return;
        }
        if (courts.length) {
            for (const court of courts) {
                const count = this.#courtCounts[getRank(court)],
                    recoveryCards = filterer({ isRecovery: true, count }),
                    attackCards = filterer({ isRecovery: false, count }),
                    pusher = (arr) =>
                        arr.length === count && hands.push([court, ...arr]);
                pusher(recoveryCards);
                pusher(attackCards);
            }
            // sort hands by highest court rank, then highest number
            // TODO: work in logic that compares points
            hands.sort(
                (a, b) =>
                    Math.abs(this.#calculatePoints({ hand: b, court: b[0] })) -
                    Math.abs(this.#calculatePoints({ hand: a, court: a[0] }))
            );
        }
        const hand = hands[0] || (numbered[0] && [numbered[0]]);
        hand ? this.setHand(hand) : this.drawSingleCardForTurn();
    }

    // validates and plays hand, while making sure
    // player holds at least 5 cards afterwards
    setHand(hand) {
        this.hand = this.#validateHand(hand) ? hand : null;
        if (this.hand) {
            this.#cards = this.#cards.filter((card) => !hand.includes(card));
            while (!this.deck.isEmpty() && this.#cards.length < 5) {
                this.#drawCard();
            }
            this.#playHand();
            return true;
        }
    }

    // see rules for logic below
    // TODO: add rules
    #validateHand(hand) {
        if (!hand) {
            // both hands will be null after a player draws card
            // for turn, therefore go to next turn without alert
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
            Object.entries(this.#courtCounts).find(([rank, count]) =>
                this.#courtIsInvalid({ rank, count, court, numbered })
            )
        ) {
            return false;
        } else if (!court && numbered.length !== 1) {
            alert("Can only play one card without a court card.");
            return false;
        }
        if (
            numbered.find((card) => getSuit(card) === "Hearts") &&
            !this.#getIsRecovery(numbered)
        ) {
            alert(
                "Numbered cards must be all hearts " +
                    "OR a combination of the other suits."
            );
            return false;
        }
        return true;
    }

    #courtIsInvalid({ court, rank, numbered, count }) {
        if (court?.includes(rank) && numbered.length !== count) {
            alert(`A ${rank} must accompany ${count} cards.`);
            return true;
        }
    }

    #getIsRecovery(numbered) {
        const suits = new Set(numbered.map(getSuit));
        return suits.has("Hearts") && suits.size === 1;
    }

    #playHand() {
        if (!this.hand) {
            return false;
        }
        const { points, isRecovery } = this.#calculatePoints({
            hand: this.hand,
            court: this.getCourt(),
        });
        this.points = `${isRecovery ? "RECOVER" : "ATTACK"} ${points}`;
        isRecovery ? (this.hp += points) : (this.opponent.hp += points);
    }

    #calculatePoints({ hand, court }) {
        const numbered = getNumbered({ hand, court }),
            isRecovery = this.#getIsRecovery(numbered),
            basePoints = this.#getBasePoints(numbered),
            factor = this.#getFactor(),
            points = (isRecovery ? 1 : -1) * (basePoints * factor);
        return { points, isRecovery };
    }

    getCourt() {
        return getCourts(this.hand)?.[0];
    }

    #getBasePoints(numbered) {
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

    #getFactor() {
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
}
