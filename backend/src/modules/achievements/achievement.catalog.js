import { getAllDefinitions } from "./achievement.definitions.js";
import { getEarnedAchievements } from "../../db/gamification.js";
import { getProgressMap } from "./achievement.queries.js";

export const getCatalogForUser = async (userId) => {
    const definitions = getAllDefinitions();
    const earnedRows = await getEarnedAchievements(userId);
    const earnedByAchievementId = new Map(earnedRows.map((row) => [row.achievementId, row]));

    const openDefinitions = definitions.filter((definition) => !earnedByAchievementId.has(definition.id));
    const progressMap = await getProgressMap(userId, openDefinitions.map((definition) => definition.id));

    const achievements = [];
    let hiddenLockedCount = 0;

    for (const definition of definitions) {
        const earnedRow = earnedByAchievementId.get(definition.id);

        if (earnedRow) {
            achievements.push({
                id: definition.id,
                name: definition.name,
                desc: definition.desc,
                emoji: definition.emoji,
                tier: definition.tier,
                xp: definition.xp,
                completed: true,
                earnedAt: earnedRow.earnedAt,
                progress: definition.target,
                target: definition.target,
            });
            continue;
        }

        if (definition.hidden) {
            hiddenLockedCount += 1;
            continue;
        }

        achievements.push({
            id: definition.id,
            name: definition.name,
            desc: definition.desc,
            emoji: definition.emoji,
            tier: definition.tier,
            xp: definition.xp,
            completed: false,
            earnedAt: null,
            progress: progressMap.get(definition.id) ?? 0,
            target: definition.target,
        });
    }

    return { achievements, hiddenLockedCount };
};

export const listCatalog = async (req, res, next) => {
    try {
        const data = await getCatalogForUser(req.user.userId);
        return res.status(200).json(data);
    } catch (err) { next(err); }
};
