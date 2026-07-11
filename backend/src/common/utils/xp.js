const XP_SESSION_CAP = 300;

export function computeXP({ actualMinutes, plannedMinutes }) {
    const base = Math.min(actualMinutes * 2, 150);
    const planBonus = Math.abs(actualMinutes - (plannedMinutes || actualMinutes)) < 5 ? 10 : 0;
    return Math.round(Math.min(base + planBonus, XP_SESSION_CAP));
}