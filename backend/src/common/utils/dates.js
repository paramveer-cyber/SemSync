export const SERVER_TZ = "Asia/Kolkata";

export function getISTDateStr() {
    return new Date().toLocaleDateString("en-CA", { timeZone: SERVER_TZ });
}

export function getISTHour() {
    return parseInt(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: SERVER_TZ }), 10) || 0;
}

export function getMonday(dateStr) {
    const d = new Date(dateStr + "T12:00:00Z");
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    return new Date(d.getTime() + diff * 86400000).toISOString().slice(0, 10);
}

export function getYesterday(todayStr) {
    const d = new Date(todayStr + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
}

export function getISTContext() {
    const today = getISTDateStr();
    return {
        today,
        yesterday: getYesterday(today),
        weekStart: getMonday(today),
        hourOfDay: getISTHour(),
    };
}
