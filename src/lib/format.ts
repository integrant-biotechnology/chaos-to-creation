/**
 * Currency, formatted for an international audience. The 'en' locale renders
 * AUD as "A$54.99" — the en-AU locale renders it as a bare "$54.99", which
 * reads as USD to the overseas journalists and buyers this site is chasing,
 * and a 40%-worse price at the Amazon checkout is a trust break at the worst
 * possible moment.
 */
const formatters = new Map<string, Intl.NumberFormat>();

export function money(amount: number, currency = 'AUD'): string {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat('en', { style: 'currency', currency });
    formatters.set(currency, f);
  }
  return f.format(amount);
}
