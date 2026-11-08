# Headless smoke test of the ROM with PyBoy: scripted button presses + screenshots.
import sys
from pyboy import PyBoy
rom = sys.argv[1] if len(sys.argv) > 1 else "/app/gb/mostrelli.gbc"
pb = PyBoy(rom, window="null", sound_emulated=False, cgb=True)
shots = 0
def run(n):
    for _ in range(n): pb.tick()
def press(b, n=1, gap=8):
    for _ in range(n):
        pb.button(b); run(gap)
def shot(name):
    pb.screen.image.save(f"/tmp/gbshot_{name}.png")
script = sys.argv[2] if len(sys.argv) > 2 else ""
run(120); shot("title")
for step in script.split():
    if step.startswith("w"): run(int(step[1:]))
    elif step.startswith("s:"): shot(step[2:])
    else:
        b, _, n = step.partition("*")
        press(b, int(n or 1))
pb.stop(save=False)
