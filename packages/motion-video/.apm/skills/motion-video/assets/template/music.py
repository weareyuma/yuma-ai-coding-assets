# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy"]
# ///
"""Synthesise the video's background music: music.wav, exactly as long as the video.

An original ambient-electronic track, so there is nothing to license: 100 BPM in
A minor, Am – Fmaj7 – C – G, two bars per chord. The arrangement is driven by the
section constants below; set them from the video's scene boundaries:

    DUR        total length, equal to DURATION in index.html
    BASS_FROM  the sub bass joins (after the intro)
    ARP_FROM   the arpeggio joins (the first "busy" scene)
    DRUMS      (start, end, level) spans with kick and hats; leave a gap for a
               moment that should land in near silence
    ARP16      spans where the arpeggio doubles to sixteenths (highest energy)
    RISERS     a noise riser ends on each of these times (entries into big scenes);
               a riser takes 1.8 s, so earlier times are skipped
    OUTRO      the groove stops and a last chord rings out to the end; use the
               outro scene's start + 0.4 s, when its picture is fully in

    uv run music.py
"""

from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48_000
DUR = 26.0
BASS_FROM = 5.0
ARP_FROM = 10.0
OUTRO = 20.4
BEAT = 60 / 100
BAR = 4 * BEAT
N = int(DUR * SR)
rng = np.random.default_rng(7)

# chord: (bass, pad voicing, arpeggio tones) as MIDI notes
CHORDS = [
    (45, [57, 60, 64, 71], [69, 72, 76, 81]),  # Am(add9)
    (41, [53, 57, 60, 64], [65, 69, 72, 76]),  # Fmaj7
    (48, [55, 60, 64, 67], [67, 72, 76, 79]),  # C
    (43, [55, 59, 62, 69], [67, 71, 74, 79]),  # G
]
CHORD_LEN = 2 * BAR
DRUMS = [(10.0, 20.0, 1.0)]  # start, end, level
ARP16 = [(14.0, 20.0)]
RISERS = [10.0]


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def saw(f, n, phase=0.0):
    t = np.arange(n) / SR
    return 2 * ((f * t + phase) % 1) - 1


def add(buf, sig, t0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    buf[0, i : i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
    buf[1, i : i + len(sig)] += sig * np.sqrt((1 + pan) / 2)


def between(t, spans):
    return any(a <= t < b for a, b, *_ in spans)


def chord_at(t):
    return CHORDS[int(t // CHORD_LEN) % len(CHORDS)]


pad = np.zeros((2, N))
bass = np.zeros((2, N))
arp = np.zeros((2, N))
drums = np.zeros((2, N))
fx = np.zeros((2, N))

# pad: three detuned saws per note, warm low-pass, slow attack and long release
n_chords = int(np.ceil(OUTRO / CHORD_LEN))
for k in range(n_chords):
    t0 = k * CHORD_LEN
    _, voicing, _ = CHORDS[k % 4]
    length = CHORD_LEN + 1.6
    n = int(length * SR)
    env = np.minimum(1, np.arange(n) / (0.9 * SR)) * np.clip((length - np.arange(n) / SR) / 1.6, 0, 1)
    for side, pan in ((0, -0.5), (1, 0.5)):
        v = sum(saw(hz(m) * 2 ** (d / 1200), n, rng.random()) for m in voicing for d in (-7 + side * 3, 0, 6 - side * 2))
        add(pad, lp(v, 1400) * env * 0.05, t0, pan)
# the outro chord: Am(add9) held and fading out
n = int((DUR - OUTRO) * SR)
env = np.minimum(1, np.arange(n) / (0.4 * SR)) * np.linspace(1, 0, n) ** 1.5
v = sum(saw(hz(m) * 2 ** (d / 1200), n, rng.random()) for m in [45, 57, 60, 64, 71, 76] for d in (-7, 0, 7))
add(pad, lp(v, 1800) * env * 0.05, OUTRO)

# sub bass on every beat from the statement onwards
t = BASS_FROM
while t < OUTRO - 0.2:
    root, _, _ = chord_at(t)
    n = int(0.55 * SR)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * hz(root) * tt) + 0.25 * np.sin(4 * np.pi * hz(root) * tt)
    add(bass, s * np.exp(-tt / 0.35) * np.minimum(1, tt / 0.008) * 0.28, t)
    t += BEAT
n = int((DUR - OUTRO) * SR)
tt = np.arange(n) / SR
add(bass, np.sin(2 * np.pi * hz(33) * tt) * np.exp(-tt / 2.2) * 0.35, OUTRO)

# arpeggio pluck, ping-pong echo
pattern = [0, 1, 2, 3, 2, 1, 2, 3]
t, i = ARP_FROM, 0
while t < OUTRO - 0.2:
    step = BEAT / 4 if between(t, ARP16) else BEAT / 2
    _, _, tones = chord_at(t)
    f = hz(tones[pattern[i % len(pattern)]])
    n = int(0.4 * SR)
    tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt) + 0.1 * np.sin(6 * np.pi * f * tt))
    level = 0.09 if between(t, ARP16) else 0.07
    add(arp, s * np.exp(-tt / 0.13) * np.minimum(1, tt / 0.004) * level, t, pan=0.25 * np.sin(i * 0.9))
    t += step
    i += 1
delay = int(3 * BEAT / 4 * SR)
echo = np.zeros_like(arp)
for k, g in enumerate((0.38, 0.22, 0.12), start=1):
    side = k % 2
    echo[side, k * delay :] += arp.sum(axis=0)[: N - k * delay] * g * 0.6
arp += lp(echo, 3500)

# kick on the beat, hats on the offbeat
for a, b, lvl in DRUMS:
    t = a
    while t < b - 0.01:
        n = int(0.4 * SR)
        tt = np.arange(n) / SR
        f = 45 + 75 * np.exp(-tt / 0.03)
        k = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.22)
        add(drums, k * 0.45 * lvl, t)
        n = int(0.09 * SR)
        h = hp(rng.standard_normal(n), 7000) * np.exp(-np.arange(n) / SR / 0.025)
        add(drums, h * 0.05 * lvl, t + BEAT / 2, pan=0.3)
        t += BEAT

# risers into the big sections: noise opening up over 1.8 s
for t_hit in RISERS:
    if t_hit < 1.8:
        continue
    n = int(1.8 * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    blk = int(0.05 * SR)
    for j in range(0, n, blk):
        fc = 400 + 7000 * (j / n) ** 2
        out[j : j + blk] = lp(noise[max(0, j - blk) : j + blk], fc)[-len(out[j : j + blk]) :]
    env = (np.arange(n) / n) ** 2.5
    add(fx, hp(out, 300) * env * 0.11, t_hit - 1.8)

mix = pad + bass + arp + drums + fx
fade_in = np.minimum(1, np.arange(N) / (2.5 * SR))
mix *= fade_in
mix = np.tanh(mix * 1.2) / 1.2  # gentle glue
mix /= np.abs(mix).max() / 0.89
out = Path(__file__).with_name("music.wav")
wavfile.write(out, SR, (mix.T * 32767).astype(np.int16))
print(f"wrote {out.name}: {DUR}s")
