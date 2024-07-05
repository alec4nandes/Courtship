function getCourts(hand) {
    return hand.filter((card) =>
        ["Jack", "Queen", "King"].includes(getRank(card))
    );
}

function getNumbered(hand) {
    const courts = getCourts(hand);
    return hand.filter((card) => !courts.includes(card));
}

function getRank(card) {
    const rank = card?.split(" ")[0];
    return rank && (rank === "Ace" ? 1 : isNaN(rank) ? rank : +rank);
}

function getSuit(card) {
    return card?.split(" ").at(-1);
}

export { getCourts, getNumbered, getRank, getSuit };
