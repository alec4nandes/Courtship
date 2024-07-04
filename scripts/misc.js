function getCourts(hand) {
    return hand?.filter((card) =>
        ["Jack", "Queen", "King"].includes(getRank(card))
    );
}

function getNumbered({ hand, court }) {
    return hand?.filter((card) => card !== court);
}

function getRank(card) {
    const rank = card?.split(" ")[0];
    return rank === "Ace" ? 1 : isNaN(rank) ? rank : +rank;
}

function getSuit(card) {
    return card?.split(" ").at(-1);
}

export { getCourts, getNumbered, getRank, getSuit };
