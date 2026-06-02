import crypto from "crypto";
import { getActiveTimer, insertTimer, updateTimer, deleteTimer } from "./timer.db.js";
import { endSession } from "../focus/session.service.js";

function computeElapsedSeconds(timer) {
    const baseMs = Date.now() - new Date(timer.startedAt).getTime();
    const baseSeconds = Math.floor(baseMs / 1000);
    const paused = timer.pausedElapsedSeconds ?? 0;
    if (timer.status === "paused" && timer.pausedAt) {
        const pausedMs = Date.now() - new Date(timer.pausedAt).getTime();
        return Math.max(0, baseSeconds - paused - Math.floor(pausedMs / 1000));
    }
    return Math.max(0, baseSeconds - paused);
}

function serializeTimer(timer) {
    if (!timer) return null;
    const elapsedSeconds = Math.min(computeElapsedSeconds(timer), timer.plannedMinutes * 60);
    return {
        id: timer.id,
        status: timer.status,
        startedAt: timer.startedAt,
        plannedMinutes: timer.plannedMinutes,
        elapsedSeconds,
        remainingSeconds: Math.max(0, timer.plannedMinutes * 60 - elapsedSeconds),
        nonce: timer.nonce,
        linkedTaskId: timer.linkedTaskId ?? null,
        linkedEvalId: timer.linkedEvalId ?? null,
        quickTitle: timer.quickTitle ?? null,
        quickCategory: timer.quickCategory ?? null,
    };
}

export async function getTimer(userId) {
    const timer = await getActiveTimer(userId);
    return serializeTimer(timer);
}

export async function startTimer(userId, body) {
    const existing = await getActiveTimer(userId);
    if (existing) {
        return { timer: serializeTimer(existing), alreadyActive: true };
    }

    const plannedMinutes = body.plannedMinutes;
    const nonce = crypto.randomBytes(16).toString("hex");

    const timer = await insertTimer({
        userId,
        status: "running",
        plannedMinutes,
        pausedElapsedSeconds: 0,
        linkedTaskId: body.linkedTaskId ?? null,
        linkedEvalId: body.linkedEvalId ?? null,
        linkedEvalDueDate: body.linkedEvalDueDate ? new Date(body.linkedEvalDueDate) : null,
        quickTitle: body.quickTitle ?? null,
        quickCategory: body.quickCategory ?? null,
        nonce,
    });

    return { timer: serializeTimer(timer), alreadyActive: false };
}

export async function pauseTimer(userId) {
    const timer = await getActiveTimer(userId);
    if (!timer) return { error: "no_active_timer" };
    if (timer.status === "paused") return { timer: serializeTimer(timer) }; // idempotent

    const updated = await updateTimer(userId, {
        status: "paused",
        pausedAt: new Date(),
    });
    return { timer: serializeTimer(updated) };
}

export async function resumeTimer(userId) {
    const timer = await getActiveTimer(userId);
    if (!timer) return { error: "no_active_timer" };
    if (timer.status === "running") return { timer: serializeTimer(timer) }; // idempotent

    const additionalPausedSec = timer.pausedAt
        ? Math.floor((Date.now() - new Date(timer.pausedAt).getTime()) / 1000)
        : 0;

    const updated = await updateTimer(userId, {
        status: "running",
        pausedAt: null,
        pausedElapsedSeconds: (timer.pausedElapsedSeconds ?? 0) + additionalPausedSec,
    });
    return { timer: serializeTimer(updated) };
}

export async function extendTimer(userId, body) {
    const timer = await getActiveTimer(userId);
    if (!timer) return { error: "no_active_timer" };
    if (timer.status !== "running") return { error: "timer_not_running" };

    const addMinutes = Math.min(Math.max(Math.floor(Number(body.addMinutes) || 5), 1), 30);
    const newPlanned = Math.min(timer.plannedMinutes + addMinutes, 240);

    const updated = await updateTimer(userId, { plannedMinutes: newPlanned });
    return { timer: serializeTimer(updated) };
}

export async function syncTimer(userId) {
    const timer = await getActiveTimer(userId);
    return { timer: serializeTimer(timer) };
}

export async function endTimer(userId, body) {
    const timer = await getActiveTimer(userId);
    if (!timer) return { dropped: true, reason: "no_active_timer" };

    if (body.nonce !== timer.nonce) {
        return { dropped: true, reason: "invalid_nonce" };
    }

    let elapsedSeconds = computeElapsedSeconds(timer);
    if (timer.status === "paused" && timer.pausedAt) {
        const addPause = Math.floor((Date.now() - new Date(timer.pausedAt).getTime()) / 1000);
        elapsedSeconds = Math.max(0, elapsedSeconds - addPause);
    }

    const actualMinutes = Math.floor(elapsedSeconds / 60);

    await deleteTimer(userId);

    if (actualMinutes < 1) {
        return { dropped: true, reason: "session_too_short" };
    }

    const sessionBody = {
        serverToken: null,
        plannedMinutes: timer.plannedMinutes,
        actualMinutes,
        invisibleSeconds: Math.min(
            Math.max(Math.floor(Number(body.invisibleSeconds) || 0), 0),
            elapsedSeconds,
        ),
        interactionCount: Math.min(
            Math.max(Math.floor(Number(body.interactionCount) || 0), 0),
            elapsedSeconds * 5,
        ),
        linkedTaskId: timer.linkedTaskId ?? undefined,
        linkedEvalId: timer.linkedEvalId ?? undefined,
        linkedEvalDueDate: timer.linkedEvalDueDate?.toISOString() ?? undefined,
    };

    const result = await endSession(userId, sessionBody);
    return { ...result, actualMinutes };
}

export async function abortTimer(userId, body) {
    const timer = await getActiveTimer(userId);
    if (!timer) return { dropped: true, reason: "no_active_timer" };
    if (body.nonce !== timer.nonce) return { dropped: true, reason: "invalid_nonce" };
    await deleteTimer(userId);
    return { dropped: true, reason: "aborted" };
}