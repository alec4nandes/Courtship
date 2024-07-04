export default class Deck {
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

    isEmpty() {
        return this.deck.length === 0;
    }
}
