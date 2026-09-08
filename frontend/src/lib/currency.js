const pkr = new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const formatPKR = (amount) => Number.isFinite(amount) ? pkr.format(amount) : '—';
