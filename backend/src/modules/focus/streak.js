import { useStreakFreeze, insertEvent } from "../../db/gamification.js";

export async function freezeStreak(userId) {
    const used = await useStreakFreeze(userId);
    if (!used) throw new Error("No freezes left");
    await insertEvent({ userId, type: "streak.freeze_used", metadata: {} });
    return { success: true };
}
