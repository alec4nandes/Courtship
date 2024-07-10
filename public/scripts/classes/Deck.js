export default class Deck {
    constructor(cards) {
        if (cards) {
            this.cards = cards;
        } else {
            const numbered = new Array(10)
                    .fill(1)
                    .map((n, i) => (i ? n + i : "Ace")),
                courts = ["Jack", "Queen", "King"],
                ranks = [...numbered, ...courts],
                suits = ["Hearts", "Spades", "Diamonds", "Clubs"],
                cards = suits
                    .map((suit) => ranks.map((rank) => `${rank} of ${suit}`))
                    .flat(Infinity);
            this.cards = cards;
        }
    }

    drawCard() {
        const randomIndex = ~~(Math.random() * this.cards.length),
            card = this.cards[randomIndex];
        this.cards.splice(randomIndex, 1);
        return card;
    }

    firstDeal() {
        const hand = [];
        while (hand.length < 5) {
            hand.push(this.drawCard());
        }
        return hand;
    }

    isEmpty() {
        return this.cards.length === 0;
    }
}
