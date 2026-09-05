// Format integer MMK amounts as "50,000 MMK"
export function formatMmk(amount: number): string {
  return `${amount.toLocaleString('en-US')} MMK`;
}

export function parseMmk(input: string): number {
  return parseInt(input.replace(/[^\d]/g, ''), 10) || 0;
}

export function calculateMoney(subtotal: number, commissionPercent: number) {
  const platformFee = Math.round((subtotal * commissionPercent) / 100);
  const workerEarnings = subtotal - platformFee;
  return {
    subtotal,
    platformFee,
    workerEarnings,
    total: subtotal,
    commissionPercent,
  };
}