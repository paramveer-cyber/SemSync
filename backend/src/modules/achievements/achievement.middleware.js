import { processAchievementEvent } from "./achievement.service.js";

export const eventObserver = (eventSlug, eventTitle, metadataBuilder = () => ({})) => {
    return (req, res, next) => {
        res.on("finish", () => {
            if (res.statusCode >= 400) return;

            const userId = req.user?.userId;
            if (!userId) return;

            const metadata = typeof metadataBuilder === "function" ? metadataBuilder(req, res) : metadataBuilder;

            processAchievementEvent(userId, eventSlug, { ...metadata, eventTitle }).catch((err) => {
                console.error(`[achievements] failed processing ${eventSlug}`, err);
            });
        });

        next();
    };
};

export const evaluationEngine = processAchievementEvent;

export const sendCompletedAchievemntsToClient = processAchievementEvent;
