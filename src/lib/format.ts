export function formatCarbon(value: number) {
  return `${value.toFixed(value >= 10 ? 1 : 2)} kg CO2e`;
}

export function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function toMonthKey(date: string) {
  return date.slice(0, 7);
}

export function toYearKey(date: string) {
  return date.slice(0, 4);
}

export function toWeekKey(date: string) {
  const value = new Date(`${date}T00:00:00.000Z`);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((value.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return `${value.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
