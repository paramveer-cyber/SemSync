import { getDefinitionsForTrigger } from "./achievement.definitions.js";
import { getCompletedAchievementIds, getProgressMap } from "./achievement.queries.js";

export const computeEvaluation = (definitions, progressMap, completedIds, event) => {
    const progressUpdates = [];
    const completions = [];

    for (const definition of definitions) {
        if (completedIds.has(definition.id)) continue;
        if (!definition.matches(event.metadata)) continue;

        const priorValue = progressMap.get(definition.id) ?? 0;
        const increment = definition.progressIncrement(event.metadata);
        const nextValue = definition.absoluteValue
            ? increment
            : priorValue + increment;

        if (nextValue === priorValue) continue;

        const clampedValue = Math.min(nextValue, definition.target);
        progressUpdates.push({ achievementId: definition.id, progressValue: clampedValue });

        if (clampedValue >= definition.target) {
            completions.push({
                achievementId: definition.id,
                tier: definition.tier,
                xp: definition.xp,
            });
        }
    }

    return { progressUpdates, completions };
};

export const evaluateEvent = async (userId, event) => {
    const candidateDefinitions = getDefinitionsForTrigger(event.type);
    if (!candidateDefinitions.length) return { progressUpdates: [], completions: [] };

    const completedIds = await getCompletedAchievementIds(userId);
    const openDefinitions = candidateDefinitions.filter((definition) => !completedIds.has(definition.id));
    if (!openDefinitions.length) return { progressUpdates: [], completions: [] };

    const progressMap = await getProgressMap(userId, openDefinitions.map((definition) => definition.id));

    return computeEvaluation(openDefinitions, progressMap, completedIds, event);
};
