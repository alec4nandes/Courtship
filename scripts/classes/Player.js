import { getCourts, getNumbered, getRank, getSuit } from "../misc.js";

export default class Player {
    #courtCounts = { Jack: 2, Queen: 3, King: 4 };
    #cards;
    #isHidden;
    // holds info on last hand played
    hand = { cards: [], points: 0 };
    gameOverMessage = false;

    constructor({ name, deck, isHidden }) {
        this.name = name;
        this.deck = deck;
        this.hp = 60;
        this.#cards = deck.firstDeal();
        this.#isHidden = isHidden;
    }

    /*
        Flow:
            * player picks cards to play from UI
            * cards are set as player's hand (Player.setHand())
            * if valid hand, Player.setHand() returns true and DOM updates
    */

    setOpponent(player) {
        this.opponent = player;
    }

    getCards() {
        return this.#isHidden
            ? new Array(this.#cards.length).fill(null)
            : this.#cards;
    }

    // validates and plays hand, while making sure
    // player holds at least 5 cards afterwards
    setHand(hand) {
        if (this.#validateHand(hand)) {
            this.#cards = this.#cards.filter((card) => !hand.includes(card));
            while (!this.deck.isEmpty() && this.#cards.length < 5) {
                this.#drawCard();
            }
            const points = this.#playHand(hand);
            this.hand = { cards: hand, points };
            return true;
        }
    }

    // see rules.txt for logic below
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
            numbered = getNumbered(hand);
        if (this.#courtIsInvalid({ court, numbered })) {
            return false;
        } else if (!court && numbered.length !== 1) {
            alert("Can only play one card without a court card.");
            return false;
        }
        const numberedHasHearts = numbered.find(
            (card) => getSuit(card) === "Hearts"
        );
        if (numberedHasHearts && !this.#getIsRecovery(numbered)) {
            alert(
                "Numbered cards must be all hearts " +
                    "OR a combination of the other suits."
            );
            return false;
        }
        return true;
    }

    #courtIsInvalid({ court, numbered }) {
        if (!court) {
            return false;
        }
        const rank = getRank(court),
            count = this.#courtCounts[rank];
        if (numbered.length !== count) {
            alert(`A ${rank} must accompany ${count} cards.`);
            return true;
        }
    }

    #getIsRecovery(numbered) {
        const suits = new Set(numbered.map(getSuit));
        return suits.has("Hearts") && suits.size === 1;
    }

    #drawCard() {
        this.deck.isEmpty()
            ? alert("No more cards in draw pile!")
            : (this.#cards = [...this.#cards, this.deck.drawCard()]);
    }

    #playHand(hand) {
        const points = this.#calculatePoints(hand);
        // positive points increase player's hp,
        // negative points decrease opponent's hp
        points > 0 ? (this.hp += points) : (this.opponent.hp += points);
        if (this.opponent.hp <= 0) {
            this.gameOverMessage = `${this.opponent.name} has no more HP! ${this.name} wins!`;
        }
        return points;
    }

    /* GET POINTS */

    #calculatePoints(hand) {
        const numbered = getNumbered(hand),
            isRecovery = this.#getIsRecovery(numbered),
            basePoints = this.#getBasePoints(numbered),
            factor = this.#getFactor(hand),
            points = (isRecovery ? 1 : -1) * (basePoints * factor);
        return points;
    }

    #getBasePoints(numbered) {
        const opponentCourt = this.opponent.getCourt(),
            opponentCourtSuit = getSuit(opponentCourt);
        return numbered
            .map((card) => {
                const rank = getRank(card),
                    suit = getSuit(card);
                return rank * (suit === opponentCourtSuit ? 2 : 1);
            })
            .reduce((acc, num) => acc + num, 0);
    }

    #getFactor(hand) {
        const opponentCourt = this.opponent.getCourt(),
            opponentCourtSuit = getSuit(opponentCourt),
            courtSuit = getSuit(this.getCourt(hand)),
            factor =
                courtSuit &&
                opponentCourtSuit &&
                courtSuit === opponentCourtSuit
                    ? 2
                    : 1;
        return factor;
    }

    getCourt(hand) {
        return getCourts(hand || this.hand.cards)[0];
    }

    /* END GET POINTS */

    // determine best hand and play it automatically
    autoMove() {
        const sortNumRanksDescending = (a, b) => getRank(b) - getRank(a),
            courts = getCourts(this.#cards),
            numbered = getNumbered(this.#cards).sort(sortNumRanksDescending),
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
            hands.sort((a, b) => {
                const getAbs = (hand) => Math.abs(this.#calculatePoints(hand));
                return getAbs(b) - getAbs(a);
            });
        }
        const hand = hands[0] || (numbered[0] && [numbered[0]]);
        hand ? this.setHand(hand) : this.drawSingleCardForTurn();
    }

    drawSingleCardForTurn() {
        this.#drawCard();
        // strategic matching of court's suit played
        // on previous turn doesn't apply anymore,
        // therefore reset both hands
        this.setHand(null);
        this.opponent.setHand(null);
    }
}
