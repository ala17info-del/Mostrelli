# Generates ORIGINAL chiptune music and SFX (composed for Bologna Monstri) as 8-bit WAV.
import math, wave, struct, os, random

SR = 22050
OUT = "/app/frontend/assets/audio"
os.makedirs(OUT, exist_ok=True)
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def freq(n):
    if n in ("-", None, "x"):
        return 0
    name, octv = n[:-1], int(n[-1])
    return 440.0 * 2 ** ((NOTE[name] + (octv - 4) * 12 - 9) / 12)


def square(f, t, duty=0.5):
    if f == 0:
        return 0
    return 1 if (t * f) % 1 < duty else -1


def tri(f, t):
    if f == 0:
        return 0
    p = (t * f) % 1
    return 4 * p - 1 if p < 0.5 else 3 - 4 * p


def render(tracks, bpm, length_beats):
    spb = 60 / bpm
    total = int(SR * spb * length_beats)
    buf = [0.0] * total
    for kind, seq, vol in tracks:
        pos = 0.0
        for note, beats in seq:
            f = freq(note)
            start, dur = int(pos * spb * SR), int(beats * spb * SR)
            for i in range(dur):
                idx = start + i
                if idx >= total:
                    break
                t = i / SR
                env = min(1, i / 200) * max(0.0, 1 - i / dur * 0.6) * (1 if i < dur - 300 else (dur - i) / 300)
                if kind == "sq":
                    s = square(f, t, 0.5)
                elif kind == "sq25":
                    s = square(f, t, 0.25)
                elif kind == "tri":
                    s = tri(f, t)
                else:  # noise drum
                    s = (random.random() * 2 - 1) * max(0, 1 - i / (SR * 0.06)) if note != "-" else 0
                buf[idx] += s * vol * env
            pos += beats
    return buf


def save(name, buf):
    with wave.open(os.path.join(OUT, name), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(1)
        w.setframerate(SR)
        w.writeframes(bytes(int(max(-1, min(1, v)) * 100 + 128) for v in buf))


def rep(seq, n):
    return seq * n

# --- Town theme: bright, original melody in F major, 32 beats loop
mel = [("F5", 1), ("A5", 0.5), ("C6", 0.5), ("A5", 1), ("G5", 1), ("F5", 0.5), ("G5", 0.5), ("A5", 1), ("-", 1), ("D5", 1),
       ("E5", 0.5), ("F5", 0.5), ("G5", 1), ("C5", 1), ("E5", 1), ("G5", 0.5), ("F5", 0.5), ("E5", 1), ("-", 1),
       ("F5", 1), ("A5", 0.5), ("C6", 0.5), ("D6", 1), ("C6", 1), ("A#5", 0.5), ("A5", 0.5), ("G5", 1), ("-", 1),
       ("A5", 0.5), ("G5", 0.5), ("F5", 1), ("E5", 1), ("G5", 1), ("F5", 2), ("-", 1)]
bass = rep([("F3", 1), ("C4", 1)], 4) + rep([("D3", 1), ("A3", 1)], 2) + rep([("C3", 1), ("G3", 1)], 2) + \
       rep([("A#2", 1), ("F3", 1)], 2) + rep([("F3", 1), ("C4", 1)], 2) + rep([("C3", 1), ("G3", 1)], 2) + rep([("F3", 1), ("C4", 1)], 2)
drum = rep([("x", 1), ("-", 0.5), ("x", 0.5)], 16)
save("town.wav", render([("sq25", mel, 0.28), ("tri", bass, 0.35), ("n", drum, 0.12)], 120, 32))

# --- Battle theme: driving A minor, 32 beats
bm = [("A4", 0.5), ("C5", 0.5), ("E5", 0.5), ("A5", 0.5), ("G5", 0.5), ("E5", 0.5), ("D5", 0.5), ("E5", 0.5)] * 2 + \
     [("F5", 0.5), ("E5", 0.5), ("D5", 0.5), ("C5", 0.5), ("D5", 1), ("B4", 1)] * 2 + \
     [("A4", 0.5), ("E5", 0.5), ("A5", 0.5), ("B5", 0.5), ("C6", 1), ("B5", 0.5), ("G5", 0.5)] * 2 + \
     [("F5", 1), ("G5", 1), ("E5", 1), ("-", 1), ("G#5", 1), ("A5", 2), ("-", 1)]
bb = rep([("A2", 0.5), ("A3", 0.5)], 8) + rep([("F2", 0.5), ("F3", 0.5)], 4) + rep([("G2", 0.5), ("G3", 0.5)], 4) + \
     rep([("A2", 0.5), ("A3", 0.5)], 8) + rep([("F2", 0.5), ("F3", 0.5)], 4) + rep([("E2", 0.5), ("E3", 0.5)], 4)
bd = rep([("x", 0.5), ("x", 0.25), ("-", 0.25)], 64)
save("battle.wav", render([("sq", bm, 0.22), ("tri", bb, 0.4), ("n", bd, 0.12)], 150, 32))

# --- Beach theme: relaxed C major, 32 beats
rm = [("E5", 1.5), ("G5", 0.5), ("C6", 1), ("B5", 1), ("A5", 1.5), ("G5", 0.5), ("E5", 2), ("D5", 1.5), ("E5", 0.5),
      ("F5", 1), ("A5", 1), ("G5", 3), ("-", 1), ("E5", 1.5), ("G5", 0.5), ("C6", 1), ("D6", 1), ("E6", 1.5), ("D6", 0.5),
      ("C6", 2), ("A5", 1), ("G5", 1), ("F5", 1), ("D5", 1), ("C5", 3), ("-", 1)]
rb = rep([("C3", 2), ("G3", 2)], 2) + rep([("F3", 2), ("C4", 2)], 1) + rep([("G3", 2), ("D3", 2)], 1) + \
     rep([("C3", 2), ("G3", 2)], 1) + rep([("A2", 2), ("E3", 2)], 1) + rep([("F3", 2), ("G3", 2)], 1) + rep([("C3", 2), ("G3", 2)], 1)
save("beach.wav", render([("sq25", rm, 0.26), ("tri", rb, 0.35)], 100, 32))

# --- SFX
save("step.wav", render([("n", [("x", 0.1)], 0.15)], 120, 0.1))
save("select.wav", render([("sq25", [("C6", 0.08), ("G6", 0.12)], 0.3)], 120, 0.2))
save("hit.wav", render([("n", [("x", 0.3)], 0.5), ("sq", [("C3", 0.1), ("G2", 0.2)], 0.3)], 120, 0.3))
save("catch.wav", render([("sq25", [("C5", 0.15), ("E5", 0.15), ("G5", 0.15), ("C6", 0.5)], 0.3)], 120, 0.95))
save("fail.wav", render([("sq", [("G4", 0.2), ("D#4", 0.2), ("C4", 0.5)], 0.3)], 120, 0.9))
save("levelup.wav", render([("sq25", [("G5", 0.12), ("G5", 0.12), ("G5", 0.12), ("C6", 0.6)], 0.3)], 120, 0.96))
save("heal.wav", render([("tri", [("C5", 0.2), ("E5", 0.2), ("G5", 0.2), ("C6", 0.2), ("E6", 0.6)], 0.45)], 120, 1.4))
save("encounter.wav", render([("sq", [("C5", 0.08), ("D#5", 0.08), ("F#5", 0.08), ("A5", 0.08)] * 3, 0.25)], 120, 0.96))
save("evolve.wav", render([("sq25", [("C5", 0.25), ("E5", 0.25), ("G5", 0.25), ("C6", 0.25), ("E6", 0.25), ("G6", 1)], 0.3)], 120, 2.25))
print("ok")
