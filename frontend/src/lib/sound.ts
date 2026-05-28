let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
    if (!ctx || ctx.state === 'closed') {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
    return ctx;
}

function playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    gain = 0.12,
    decay?: number,
    delay = 0,
) {
    try {
        const ac = getCtx();
        const osc = ac.createOscillator();
        const gainNode = ac.createGain();
        const compressor = ac.createDynamicsCompressor();

        osc.connect(gainNode);
        gainNode.connect(compressor);
        compressor.connect(ac.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ac.currentTime + delay);

        gainNode.gain.setValueAtTime(0, ac.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(
            gain,
            ac.currentTime + delay + 0.01,
        );
        gainNode.gain.exponentialRampToValueAtTime(
            0.0001,
            ac.currentTime + delay + (decay ?? duration),
        );

        osc.start(ac.currentTime + delay);
        osc.stop(ac.currentTime + delay + duration + 0.05);
    } catch {}
}

const xpPlaying = { at: 0 };
export function playXPGain() {
    const now = Date.now();
    if (now - xpPlaying.at < 300) return;
    xpPlaying.at = now;

    playTone(880, 0.12, 'sine', 0.07);
    playTone(1108, 0.1, 'sine', 0.05, undefined, 0.06);
}

export function playLevelUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
        playTone(f, 0.28, 'sine', 0.11, 0.26, i * 0.11);
    });
    setTimeout(() => playTone(2093, 0.18, 'sine', 0.04), 380);
}

const toastPlaying = { at: 0 };
export function playToastUnlock() {
    const now = Date.now();
    if (now - toastPlaying.at < 500) return;
    toastPlaying.at = now;

    playTone(784, 0.1, 'triangle', 0.09);
    playTone(988, 0.12, 'triangle', 0.08, undefined, 0.08);
    playTone(1175, 0.15, 'sine', 0.07, undefined, 0.16);
}

export function playCinematicUnlock(tier: 'platinum' | 'legendary' | 'hidden') {
    if (tier === 'legendary') {
        const notes = [392, 494, 587, 740, 988];
        notes.forEach((f, i) =>
            playTone(f, 0.5, 'sine', 0.13 - i * 0.01, 0.45, i * 0.13),
        );
        setTimeout(() => {
            playTone(1480, 0.6, 'sine', 0.08, 0.55);
            playTone(1976, 0.5, 'sine', 0.05, 0.45, 0.1);
        }, 700);
    } else if (tier === 'platinum') {
        [880, 1108, 1318].forEach((f, i) => {
            playTone(f, 0.55, 'sine', 0.09, 0.5, i * 0.07);
        });
        setTimeout(() => playTone(2637, 0.35, 'sine', 0.04, 0.3), 350);
    } else {
        [1047, 880, 740, 880, 1047, 1319].forEach((f, i) => {
            playTone(f, 0.2, 'sine', 0.08, 0.18, i * 0.1);
        });
    }
}

export function playDismiss() {
    playTone(660, 0.08, 'sine', 0.04);
    playTone(523, 0.08, 'sine', 0.03, undefined, 0.06);
}

export function playStreakMilestone() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
        playTone(f, 0.22, 'sine', 0.1, 0.2, i * 0.08);
    });
}

let warmed = false;
export function warmAudio() {
    if (warmed) return;
    warmed = true;
    try {
        const ac = getCtx();
        const buf = ac.createBuffer(1, 1, 22050);
        const src = ac.createBufferSource();
        src.buffer = buf;
        src.connect(ac.destination);
        src.start(0);
    } catch {}
}
