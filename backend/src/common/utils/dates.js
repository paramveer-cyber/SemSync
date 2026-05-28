/** Authoritative timezone for all date/streak logic. Client timezone is never used. */
export const SERVER_TZ = "Asia/Kolkata";

/** Today's date string in IST (YYYY-MM-DD). */
export function getISTDateStr() {
    return new Date().toLocaleDateString("en-CA", { timeZone: SERVER_TZ });
}

/** Current hour (0–23) in IST. */
export function getISTHour() {
    return parseInt(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: SERVER_TZ }), 10) || 0;
}

/** Monday of the week containing dateStr (YYYY-MM-DD). */
export function getMonday(dateStr) {
    const d = new Date(dateStr + "T12:00:00Z");
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    return new Date(d.getTime() + diff * 86400000).toISOString().slice(0, 10);
}

/** Yesterday's date string relative to a given YYYY-MM-DD string. */
export function getYesterday(todayStr) {
    const d = new Date(todayStr + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
}

/** Convenience: returns { today, yesterday, weekStart, hourOfDay } in one call. */
export function getISTContext() {
    const today = getISTDateStr();
    return {
        today,
        yesterday: getYesterday(today),
        weekStart: getMonday(today),
        hourOfDay: getISTHour(),
    };
}
