import { insertEvent, upsertStats, countEventsByType } from "../../db/gamification.js";

const XP_SESSION_CAP = 300;

export function computeIntegrityScore({ plannedMinutes, actualMinutes, invisibleSeconds, interactionCount }) {
    const ratio = actualMinutes / (plannedMinutes || actualMinutes);
    const durationScore =
        ratio > 1.5 ? 0.3 :
        ratio < 0.5 ? 0.4 :
        (ratio >= 0.85 && ratio <= 1.15) ? 1.0 : 0.75;

    const invisRatio = invisibleSeconds / (actualMinutes * 60 || 1);
    const visibilityScore =
        invisRatio > 0.5 ? 0.1 :
        invisRatio > 0.3 ? 0.5 :
        invisRatio > 0.1 ? 0.8 : 1.0;

    const expected = actualMinutes * 5;
    const interactionScore =
        interactionCount === 0 ? 0.3 :
        interactionCount < expected * 0.1 ? 0.5 :
        interactionCount < expected * 0.3 ? 0.75 : 1.0;

    return (durationScore * 0.4) + (visibilityScore * 0.35) + (interactionScore * 0.25);
}

export function computeXP({ actualMinutes, integrityScore, plannedMinutes }) {
    const base = Math.min(actualMinutes * 2, 150);
    const planBonus = Math.abs(actualMinutes - (plannedMinutes || actualMinutes)) < 5 ? 10 : 0;
    const mult = integrityScore < 0.4 ? 0 : integrityScore < 0.6 ? 0.5 : 1.0;
    return Math.round(Math.min((base + planBonus) * mult, XP_SESSION_CAP));
}

export async function awardAchievementXpIdempotent(userId, achievements, today, weekStart, tx) {
    for (const a of achievements) {
        const alreadyAwarded = await countEventsByType(userId, `achievement.xp.${a.id}`, tx);
        if (alreadyAwarded > 0) continue;
        await insertEvent({ userId, type: `achievement.xp.${a.id}`, metadata: { xp: a.xp } }, tx);
        await upsertStats(userId, 0, a.xp, today, weekStart, false, tx);
    }
}
