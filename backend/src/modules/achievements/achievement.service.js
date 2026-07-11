import { insertEvent, addAchievementXp } from "../../db/gamification.js";
import { pushAchievements } from "../../common/sse.js";
import { evaluateEvent } from "./achievement.evaluator.js";
import { setProgressValue, insertCompletion, runInAchievementTransaction } from "./achievement.queries.js";
import { getDefinitionById, CINEMATIC_TIERS } from "./achievement.definitions.js";

const persistEvaluationResult = async (userId, evaluationResult) => {
    const { progressUpdates, completions } = evaluationResult;
    if (!progressUpdates.length && !completions.length) return [];

    return runInAchievementTransaction(async (tx) => {
        for (const update of progressUpdates) {
            await setProgressValue(userId, update.achievementId, update.progressValue, tx);
        }

        const persistedCompletions = [];
        for (const completion of completions) {
            const row = await insertCompletion(userId, completion.achievementId, completion.tier, completion.xp, tx);
            if (row) persistedCompletions.push(completion);
        }

        await addAchievementXp(userId, persistedCompletions.reduce((sum, c) => sum + c.xp, 0), tx);

        return persistedCompletions;
    });
};

const buildNotificationPayload = (completions) =>
    completions.map((completion) => {
        const definition = getDefinitionById(completion.achievementId);
        return {
            id: completion.achievementId,
            name: definition?.name ?? null,
            desc: definition?.desc ?? null,
            emoji: definition?.emoji ?? null,
            tier: completion.tier,
            xpAwarded: completion.xp,
            feedbackType: CINEMATIC_TIERS.has(completion.tier) ? "cinematic" : "toast",
        };
    });

const notifyClient = (userId, completions) => {
    if (!completions.length) return;
    pushAchievements(userId, buildNotificationPayload(completions));
};

export const processAchievementEvent = async (userId, eventType, metadata = {}) => {
    await insertEvent({ userId, type: eventType, metadata });

    const evaluationResult = await evaluateEvent(userId, { type: eventType, metadata });
    const persistedCompletions = await persistEvaluationResult(userId, evaluationResult);

    notifyClient(userId, persistedCompletions);
    return persistedCompletions;
};
