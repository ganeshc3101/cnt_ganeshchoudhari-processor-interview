import { majorToMinor } from '@/shared/lib/money';

import { classifyCardType } from './cardType';

import type { Transaction } from '../types/transaction';

type SeedInput = {
  cardholderName: string | null;
  cardNumber: string;
  amountMajor: number;
  daysAgo: number;
  hour?: number;
};

const SEEDS: ReadonlyArray<SeedInput> = [
  { cardholderName: 'Ava Morgan', cardNumber: '4242424242424242', amountMajor: 128.5, daysAgo: 0, hour: 9 },
  { cardholderName: 'Liam Chen', cardNumber: '5555555555554444', amountMajor: 42.18, daysAgo: 0, hour: 11 },
  { cardholderName: 'Noah Patel', cardNumber: '378282246310005', amountMajor: 812.0, daysAgo: 0, hour: 14 },
  { cardholderName: 'Sofia Ramirez', cardNumber: '6011111111111117', amountMajor: 56.42, daysAgo: 1, hour: 8 },
  { cardholderName: 'Mia Thompson', cardNumber: '4111111111111111', amountMajor: 240.0, daysAgo: 1, hour: 16 },
  { cardholderName: 'Jay Cole', cardNumber: '2221000000000009', amountMajor: 15.0, daysAgo: 1, hour: 20 },
  { cardholderName: 'Evelyn Park', cardNumber: '5105105105105100', amountMajor: 310.75, daysAgo: 2, hour: 10 },
  { cardholderName: 'Isla Webb', cardNumber: '4000056655665556', amountMajor: 78.0, daysAgo: 2, hour: 13 },
  { cardholderName: 'Leo Martin', cardNumber: '371449635398431', amountMajor: 999.99, daysAgo: 2, hour: 17 },
  { cardholderName: 'Ethan Rivera', cardNumber: '6011000990139424', amountMajor: 19.0, daysAgo: 3, hour: 7 },
  { cardholderName: null, cardNumber: '4012888888881881', amountMajor: 12.4, daysAgo: 3, hour: 9 },
  { cardholderName: 'Ruby Hart', cardNumber: '5454545454545454', amountMajor: 450.0, daysAgo: 3, hour: 21 },
  { cardholderName: 'Owen Blake', cardNumber: '4916108926268679', amountMajor: 85.6, daysAgo: 4, hour: 12 },
  { cardholderName: 'Grace Liu', cardNumber: '340000000000009', amountMajor: 1850.0, daysAgo: 4, hour: 15 },
  { cardholderName: 'Henry Walsh', cardNumber: '6011516011516011', amountMajor: 64.0, daysAgo: 4, hour: 19 },
  { cardholderName: 'Chloe Nguyen', cardNumber: '5200828282828210', amountMajor: 32.1, daysAgo: 5, hour: 10 },
  { cardholderName: 'Mason Kim', cardNumber: '4485040371536584', amountMajor: 190.55, daysAgo: 5, hour: 13 },
  { cardholderName: 'Layla Ahmed', cardNumber: '1000200030004000', amountMajor: 14.99, daysAgo: 5, hour: 18 },
  { cardholderName: 'Zoey Brooks', cardNumber: '6011000000000004', amountMajor: 275.0, daysAgo: 6, hour: 11 },
  { cardholderName: 'Aiden Gray', cardNumber: '5100290029002909', amountMajor: 60.0, daysAgo: 6, hour: 14 },
  { cardholderName: 'Nora Sato', cardNumber: '4009348888881881', amountMajor: 29.95, daysAgo: 7, hour: 9 },
  { cardholderName: 'Lucas Dean', cardNumber: '371144371144376', amountMajor: 540.0, daysAgo: 7, hour: 16 },
  { cardholderName: null, cardNumber: '9999888877776666', amountMajor: 7.5, daysAgo: 8, hour: 12 },
  { cardholderName: 'Hazel Reed', cardNumber: '4556737586899855', amountMajor: 113.04, daysAgo: 9, hour: 10 },
  { cardholderName: 'Elena Ortiz', cardNumber: '5210123456789012', amountMajor: 408.0, daysAgo: 10, hour: 15 },
  { cardholderName: 'Victor Shaw', cardNumber: '6011000000000012', amountMajor: 48.25, daysAgo: 12, hour: 19 },
];

function seedIdFor(cardNumber: string, daysAgo: number, hour?: number): string {
  return `seed-${cardNumber.slice(-4)}-${daysAgo}-${hour ?? 0}`;
}

export function buildSeedTransactions(now = new Date()): Transaction[] {
  return SEEDS.map((seed) => {
    const when = new Date(now);
    when.setDate(when.getDate() - seed.daysAgo);
    when.setHours(seed.hour ?? 12, 0, 0, 0);

    const cardType = classifyCardType(seed.cardNumber);
    const rejected = cardType === null;

    return {
      id: seedIdFor(seed.cardNumber, seed.daysAgo, seed.hour),
      cardholderName: seed.cardholderName,
      cardNumber: seed.cardNumber,
      cardType,
      amountMinor: majorToMinor(seed.amountMajor),
      currency: 'USD',
      occurredAt: when.toISOString(),
      status: rejected ? 'REJECTED' : 'ACCEPTED',
      rejectionReason: rejected ? 'Unsupported card network (leading digit).' : null,
      source: 'SEED',
    };
  });
}
