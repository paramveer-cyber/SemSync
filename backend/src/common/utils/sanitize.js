/**
 * Strip internal rule/condition fields before sending achievements to the client.
 * Hidden unearned achievements are fully masked — no id, name, desc, emoji, tier, or xp.
 */
export function sanitizeAchievements(arr) {
    return (arr ?? []).map(a => {
        const isHiddenLocked = !!a.hidden && !a.earned;
        return {
            id:         isHiddenLocked ? null : (a.id ?? null),
            name:       isHiddenLocked ? null : (a.name ?? null),
            desc:       isHiddenLocked ? null : (a.desc ?? null),
            emoji:      isHiddenLocked ? null : (a.emoji ?? null),
            tier:       isHiddenLocked ? null : a.tier,
            xp:         isHiddenLocked ? null : (a.xp ?? null),
            hidden:     !!a.hidden,
            earned:     !!a.earned,
            locked:     a.locked ?? !a.earned,
            earnedAt:   a.earnedAt ?? null,
            xpAwarded:  a.xpAwarded ?? null,
        };
    });
}
