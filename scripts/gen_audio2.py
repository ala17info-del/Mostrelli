# Extra ORIGINAL place-themed chiptunes. Run after gen_audio.py (reuses its helpers).
import importlib.util, sys
spec = importlib.util.spec_from_file_location("g", "/app/scripts/gen_audio.py")
g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
render, save = g.render, g.save


def S(txt):
    out = []
    for tok in txt.split():
        n, d = tok.split(":")
        out.append((n, float(d)))
    return out


def waltz_bass(chords, bars_each=1):
    seq = []
    for root, c1 in chords:
        for _ in range(bars_each):
            seq += [(root, 1), (c1, 1), (c1, 1)]
    return seq

# Bologna: "liscio" waltz 3/4 in G (accordion-like square + oom-pah-pah)
mel = S("D5:1 G5:1 B5:1 A5:2 G5:1 F#5:1 A5:1 D6:1 C6:3 B5:1 G5:1 E5:1 D5:2 B4:1 C5:1 E5:1 G5:1 F#5:3 "
        "D5:1 G5:1 B5:1 D6:2 B5:1 C6:1 A5:1 F#5:1 G5:3 E5:1 G5:1 C6:1 B5:1 A5:1 G5:1 A5:1 F#5:1 D5:1 G5:3")
bass = waltz_bass([("G3", "B3"), ("D3", "A3"), ("D3", "C4"), ("G3", "B3"), ("C3", "E3"), ("C3", "G3"), ("D3", "F#3"), ("D3", "A3"),
                   ("G3", "B3"), ("G3", "D4"), ("D3", "C4"), ("G3", "B3"), ("C3", "E3"), ("D3", "F#3"), ("D3", "A3"), ("G3", "B3")])
save("bologna.wav", render([("sq", mel, 0.22), ("tri", bass, 0.35)], 170, 48))

# Osteria Grande: fast polka 2/4 in C
mel = S("G5:0.5 E5:0.5 G5:0.5 C6:0.5 B5:0.5 A5:0.5 G5:1 F5:0.5 D5:0.5 F5:0.5 B5:0.5 A5:0.5 G5:0.5 F5:1 "
        "E5:0.5 G5:0.5 C6:0.5 E6:0.5 D6:0.5 C6:0.5 B5:0.5 A5:0.5 G5:0.5 F5:0.5 E5:0.5 D5:0.5 C5:2 "
        "G5:0.5 E5:0.5 G5:0.5 C6:0.5 B5:0.5 A5:0.5 G5:1 A5:0.5 B5:0.5 C6:0.5 D6:0.5 E6:1 C6:1")
bass = [("C3", 0.5), ("G3", 0.5)] * 4 + [("G2", 0.5), ("G3", 0.5)] * 4 + [("C3", 0.5), ("G3", 0.5)] * 4 + [("G2", 0.5), ("D3", 0.5), ("C3", 0.5), ("G3", 0.5)] * 2 + [("C3", 0.5), ("G3", 0.5)] * 4 + [("F3", 0.5), ("C4", 0.5), ("C3", 0.5), ("G3", 0.5)] * 2
drum = [("x", 0.5), ("-", 0.5)] * 24
save("osteria.wav", render([("sq25", mel, 0.26), ("tri", bass, 0.38), ("n", drum, 0.1)], 150, 24))

# Castel San Pietro Terme: calm arpeggios
arp = S(" ".join([f"{n}:0.5" for n in "C4 E4 G4 C5 G4 E4 A3 C4 E4 A4 E4 C4 F3 A3 C4 F4 C4 A3 G3 B3 D4 G4 D4 B3".split()] * 2))
mel = S("E5:3 D5:1 C5:2 E5:2 A5:3 G5:1 E5:4 F5:3 E5:1 D5:2 C5:2 B4:3 C5:1 D5:4")
save("terme.wav", render([("tri", arp, 0.35), ("sq25", mel, 0.16)], 88, 24))

# Imola: racing rock in E minor
riff = S(" ".join([f"{n}:0.25" for n in "E2 E2 E3 E2 G2 E2 A2 B2".split()] * 8))
mel = S("E5:0.5 G5:0.5 B5:1 A5:0.5 G5:0.5 F#5:1 E5:0.5 F#5:0.5 G5:0.5 A5:0.5 B5:2 "
        "D6:0.5 B5:0.5 A5:0.5 G5:0.5 A5:1 F#5:1 G5:0.5 F#5:0.5 E5:0.5 D5:0.5 E5:2")
drum = [("x", 0.25), ("-", 0.25)] * 32
save("imola.wav", render([("sq", riff, 0.2), ("sq25", mel, 0.22), ("n", drum, 0.12)], 168, 16))

# Ferrara: Renaissance-flavoured dance in D dorian
mel = S("D5:1 E5:1 F5:1 G5:1 A5:2 G5:1 F5:1 E5:1 C5:1 D5:2 A4:2 "
        "F5:1 G5:1 A5:1 B5:1 C6:2 A5:1 G5:1 F5:1 E5:1 D5:4 "
        "A5:1 G5:1 F5:1 E5:1 F5:1 G5:1 A5:2 G5:1 F5:1 E5:1 C5:1 D5:4")
bass = S("D3:4 C3:4 D3:4 A2:4 F3:4 C3:4 D3:4 D3:4 A2:4 C3:4")
save("ferrara.wav", render([("tri", mel, 0.4), ("sq25", bass, 0.14)], 100, 40))

# Castel Maggiore: cheerful mazurka 3/4 in F
mel = S("C5:1.5 F5:0.5 A5:1 G5:1 F5:1 E5:1 F5:2 C5:1 D5:1.5 G5:0.5 A#5:1 A5:1 G5:1 F5:1 E5:3 "
        "C5:1.5 F5:0.5 A5:1 C6:1 A5:1 F5:1 D6:2 C6:1 A#5:1 A5:1 G5:1 F5:3")
bass = waltz_bass([("F3", "A3"), ("C3", "G3"), ("F3", "A3"), ("F3", "C4"), ("A#2", "D3"), ("C3", "E3"), ("C3", "G3"), ("F3", "A3"),
                   ("F3", "A3"), ("F3", "C4"), ("A#2", "D3"), ("C3", "G3"), ("F3", "A3")])
save("maggiore.wav", render([("sq25", mel, 0.24), ("tri", bass, 0.35)], 150, 39))

# Altedo: country-fair "sagra" tune in A major
mel = S("A4:0.5 C#5:0.5 E5:1 E5:0.5 F#5:0.5 E5:1 C#5:0.5 E5:0.5 A5:1 G#5:0.5 F#5:0.5 E5:1 "
        "D5:0.5 F#5:0.5 A5:1 G#5:0.5 F#5:0.5 E5:1 C#5:0.5 B4:0.5 A4:1 B4:1 A4:2")
bass = [("A2", 0.5), ("E3", 0.5)] * 8 + [("D3", 0.5), ("A3", 0.5)] * 4 + [("E3", 0.5), ("B3", 0.5)] * 2 + [("A2", 0.5), ("E3", 0.5)] * 2
drum = [("x", 0.5), ("x", 0.25), ("-", 0.25)] * 16
save("altedo.wav", render([("sq", mel, 0.2), ("tri", bass, 0.38), ("n", drum, 0.1)], 132, 16))
print("ok2")
