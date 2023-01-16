import { Card } from './gameState'

export enum CardSuit {
  Clubs,
  Hearts,
  Diamond,
  Spade,
  Joker,
}

export enum CardRank {
  Ace = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
}

export const isJoker = (card: Card): boolean => {
  return getCardNumberInDeck(card) > 51
}

const getCardNumberInDeck = (card: Card) => card % 54

export const getCardSuit = (card: Card): CardSuit => {
  // Handle multiple decks
  const singleDeckNumber = getCardNumberInDeck(card)
  if (isJoker(singleDeckNumber)) return CardSuit.Joker

  const suitId = Math.floor(singleDeckNumber / 13)

  switch (suitId) {
    case 0:
      return CardSuit.Clubs
    case 1:
      return CardSuit.Hearts
    case 2:
      return CardSuit.Diamond
    case 3:
      return CardSuit.Spade
  }

  throw new Error(`Card number is invalid: ${card}`)
}

export const getCardRank = (card: Card): CardRank => {
  // Handle multiple decks
  const singleDeckNumber = getCardNumberInDeck(card)

  if (isJoker(singleDeckNumber))
    throw new Error(`Card number is invalid for retrieving rank: ${card}`)

  const rankNumber = (singleDeckNumber % 13) + 1

  return rankNumber as CardRank
}

export const suitToString = (c: Card): string => {
  switch (getCardSuit(c)) {
    case CardSuit.Clubs:
      return '♣'
    case CardSuit.Hearts:
      return '♥'
    case CardSuit.Diamond:
      return '♦'
    case CardSuit.Spade:
      return '♠'
    default:
      return 'Joker'
  }
}

export const rankToString = (c: Card): string => {
  if (isJoker(c)) return ''

  switch (getCardRank(c)) {
    case CardRank.Ace:
      return 'A'
    case CardRank.Two:
      return '2'
    case CardRank.Three:
      return '3'
    case CardRank.Four:
      return '4'
    case CardRank.Five:
      return '5'
    case CardRank.Six:
      return '6'
    case CardRank.Seven:
      return '7'
    case CardRank.Eight:
      return '8'
    case CardRank.Nine:
      return '9'
    case CardRank.Ten:
      return '10'
    case CardRank.Jack:
      return 'J'
    case CardRank.Queen:
      return 'Q'
    case CardRank.King:
      return 'K'
  }
}

export const cardToString = (c: Card): string => {
  if (isJoker(c)) return 'Joker'

  const suit = suitToString(c)
  const rank = rankToString(c)

  return `${rank}${suit}`
}
