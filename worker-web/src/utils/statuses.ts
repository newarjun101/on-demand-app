export const BOOKING_STATUS_FLOW = ['CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'] as const;
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  ON_THE_WAY: 'On The Way',
  ARRIVED: 'Arrived',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
};

export const NEXT_STATUS_BUTTONS: Record<string, { label: string; next: string; variant?: 'primary' | 'secondary' }> = {
  CONFIRMED: { label: 'Start Journey', next: 'ON_THE_WAY' },
  ON_THE_WAY: { label: "I've Arrived", next: 'ARRIVED' },
  ARRIVED: { label: 'Start Job', next: 'IN_PROGRESS' },
  IN_PROGRESS: { label: 'Complete Job', next: 'COMPLETED' },
};

export function nextActionFor(status: string) {
  return NEXT_STATUS_BUTTONS[status];
}