export const REQUEST_STATUS_FLOW = [
  'CREATED',
  'FINDING_WORKERS',
  'QUOTES_RECEIVED',
  'QUOTE_ACCEPTED',
  'BOOKING_CONFIRMED',
  'ON_THE_WAY',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'PAYMENT',
  'REVIEW',
];

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  CREATED: 'Request Created',
  FINDING_WORKERS: 'Finding Workers',
  QUOTES_RECEIVED: 'Quotes Received',
  QUOTE_ACCEPTED: 'Quote Accepted',
  BOOKING_CONFIRMED: 'Booking Confirmed',
  ON_THE_WAY: 'Worker On The Way',
  ARRIVED: 'Worker Arrived',
  IN_PROGRESS: 'Job In Progress',
  COMPLETED: 'Completed',
  PAYMENT: 'Payment',
  REVIEW: 'Review',
};

export function statusIndex(status: string): number {
  return REQUEST_STATUS_FLOW.indexOf(status);
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Booking Confirmed',
  ON_THE_WAY: 'On The Way',
  ARRIVED: 'Arrived',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
};