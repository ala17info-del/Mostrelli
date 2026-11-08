p = "/app/frontend/src/game/TileMap.tsx"
s = open(p).read()
rep = [
('import { StyleSheet, View } from "react-native";', 'import { Platform, StyleSheet, View } from "react-native";'),
('''const Ground = memo(function Ground({ map, size, phase }: { map: GameMap; size: number; phase: number }) {
  return (
    <>
      {map.tiles.map((row, y) => (
        <View key={y} style={st.row}>
          {row.split("").map((ch, x) => (
            <View key={x} style={{ width: size, height: size }}>
              <TileArt ch={ch} size={size} x={x} y={y} phase={ANIMATED_TILES.has(ch) ? phase : 0} />''', '''const WEB = Platform.OS === "web";
// Tall things (trees, roofs, walls) cast a soft shadow on the ground tile just below them.
const TALL = new Set(["T", "R", "H", "B", "D"]);
const Ground = memo(function Ground({ map, size, phase }: { map: GameMap; size: number; phase: number }) {
  return (
    <>
      {map.tiles.map((row, y) => (
        <View key={y} style={st.row}>
          {row.split("").map((ch, x) => (
            <View key={x} style={{ width: size, height: size }}>
              <TileArt ch={ch} size={size} x={x} y={y} phase={ANIMATED_TILES.has(ch) ? phase : 0} shadow={!TALL.has(ch) && TALL.has(map.tiles[y - 1]?.[x] ?? "")} />'''),
('''  const prev = useRef({ px, py, id: map.id, size });
  const [frame, setFrame] = useState(0);''', '''  const prev = useRef({ px, py, id: map.id, size });
  const [frame, setFrame] = useState(0);
  const p0 = prev.current;
  const jumpNow = p0.id !== map.id || p0.size !== size || Math.abs(px - p0.px) + Math.abs(py - p0.py) > 1;
  // Browsers (iPhone Safari): let the compositor animate with CSS transitions instead of JS frames.
  const webMove = (tx: number, ty: number) => ({
    transform: [{ translateX: tx }, { translateY: ty }],
    transitionProperty: "transform", transitionDuration: jumpNow ? "0ms" : `${stepMs}ms`, transitionTimingFunction: "linear", willChange: "transform",
  }) as any;'''),
('    if (!moved) return;\n', '    if (!moved) return;\n    setFrame((f) => f + 1);\n    if (WEB) return;\n'),
('    bob.value = withSequence(withTiming(-size * 0.06, { duration: stepMs / 2 }), withTiming(0, { duration: stepMs / 2 }));\n    setFrame((f) => f + 1);\n', '    bob.value = withSequence(withTiming(-size * 0.06, { duration: stepMs / 2 }), withTiming(0, { duration: stepMs / 2 }));\n'),
('''      <Animated.View style={[{ position: "absolute", left: offX, top: offY, width: W * size, height: Hh * size }, camStyle]}>''', '''      <Animated.View style={[{ position: "absolute", left: offX, top: offY, width: W * size, height: Hh * size }, WEB ? webMove(camTx, camTy) : camStyle]}>'''),
('''        <Animated.View style={[st.actor, { width: size, height: size }, plStyle]} testID="player-sprite">''', '''        <Animated.View style={[st.actor, { width: size, height: size }, WEB ? webMove(px * size, py * size) : plStyle]} testID="player-sprite">'''),
]
for a, b in rep:
    assert a in s, a[:80]
    s = s.replace(a, b)
open(p, "w").write(s)

p = "/app/frontend/src/game/TileArt.tsx"
s = open(p).read()
start = s.index('    case "C":\n')
end = s.index('    case "A":\n')
new_mid = '''    case "C":
      // Cobblestones: rounded stones with light top and shaded bottom.
      inner = (
        <>
          {[0, 1, 2].map((j) =>
            [0, 1, 2].map((i) => {
              const v = hash(x * 3 + i, y * 3 + j) % 3;
              const l = (i * 2.7 + (j % 2 ? 0.6 : 0.1)) * u, t = (j * 2.7 + 0.2) * u;
              return (
                <React.Fragment key={`${i}${j}`}>
                  <Px l={l} t={t} w={u * 2.3} h={u * 2.3} c={["#b8a68e", "#c4b39a", "#ab9a82"][v]} r={u * 0.8} />
                  <Px l={l + u * 0.4} t={t + u * 0.3} w={u * 1.2} h={u * 0.4} c="#dacbb4" />
                  <Px l={l + u * 0.3} t={t + u * 1.8} w={u * 1.7} h={u * 0.4} c="#8f7f68" />
                </React.Fragment>
              );
            }),
          )}
        </>
      );
      break;
    case "P":
      // Portico arch: pillars with capitals, shaded vault and lit floor.
      inner = (
        <>
          <Px l={0} t={0} w={s} h={u * 1.3} c="#d98a5c" />
          <Px l={0} t={u * 1.1} w={s} h={u * 0.3} c="#a85a34" />
          <Px l={u * 1.4} t={u * 1.6} w={u * 5.2} h={u * 6.4} c="#4a1f10" r={u * 2.6} />
          <Px l={u * 1.4} t={u * 4.5} w={u * 5.2} h={u * 3.5} c="#4a1f10" />
          <Px l={u * 1.9} t={u * 3} w={u * 4.2} h={u * 5} c="#6e2e17" r={u * 2} />
          <Px l={u * 1.9} t={u * 6.6} w={u * 4.2} h={u * 1.4} c="#9a7a5a" />
          <Px l={u * 0.1} t={u * 1.4} w={u * 1.3} h={u * 6.6} c="#d07a4c" />
          <Px l={u * 6.6} t={u * 1.4} w={u * 1.3} h={u * 6.6} c="#c06a3e" />
          <Px l={0} t={u * 1.4} w={u * 1.6} h={u * 0.5} c="#e8a070" />
          <Px l={u * 6.4} t={u * 1.4} w={u * 1.6} h={u * 0.5} c="#e8a070" />
          <Px l={u * 0.3} t={u * 2} w={u * 0.3} h={u * 6} c="#e8a070" />
        </>
      );
      break;
    case "W":
    case "O": {
      const off = phase ? u * 2 : 0;
      const hi = ch === "O" ? "#7fd3e6" : "#8fd3d3";
      inner = (
        <>
          <Px l={0} t={u * 5} w={s} h={u * 3} c={ch === "O" ? "#17607a" : "#237a7a"} />
          <Px l={u + off} t={u * 2} w={u * 3} h={u * 0.6} c={hi} />
          <Px l={u * 1.5 + off} t={u * 1.5} w={u * 2} h={u * 0.5} c="#d8f6ff" />
          <Px l={u * 4 - off} t={u * 5.5} w={u * 3} h={u * 0.6} c={hi} />
          {ch === "O" && hv % 4 === 0 && <Px l={u * 6} t={u} w={u * 0.8} h={u * 0.8} c="#ffffff" />}
          <Px l={u * 2 + off / 2} t={u * 3.8} w={u * 0.5} h={u * 0.5} c="#b8ecef" />
          <Px l={u * 6 - off / 2} t={u * 7} w={u * 0.5} h={u * 0.5} c="#b8ecef" />
        </>
      );
      break;
    }
    case "R":
      // Terracotta roof tiles (coppi) in staggered rows with light and shade.
      inner = (
        <>
          {[0, 2, 4, 6].map((ty) => (
            <React.Fragment key={ty}>
              <Px l={0} t={ty * u} w={s} h={u * 0.5} c="#d9704c" />
              <Px l={0} t={ty * u + u * 1.55} w={s} h={u * 0.45} c="#6e2015" />
              {[0, 2, 4, 6, 8].map((cx) => (
                <Px key={cx} l={(cx - ((ty / 2) % 2)) * u} t={ty * u + u * 0.3} w={u * 0.35} h={u * 1.3} c="#8e321e" />
              ))}
              {[1, 5].map((cx) => (
                <Px key={`s${cx}`} l={(cx - ((ty / 2) % 2) + 0.4) * u} t={ty * u + u * 0.6} w={u * 0.5} h={u * 0.3} c="#e8906c" />
              ))}
            </React.Fragment>
          ))}
        </>
      );
      break;
    case "H":
      // Plaster wall with cornice, stone window frame and green shutters (persiane).
      inner = (
        <>
          <Px l={0} t={0} w={s} h={u * 0.8} c="#c9b48c" />
          <Px l={0} t={u * 0.8} w={s} h={u * 0.25} c="#a8946c" />
          {hv % 3 === 0 && <Px l={((hv >> 3) % 6 + 1) * u} t={u * 6.2} w={u * 0.5} h={u * 0.4} c="#d8c7a0" />}
          <Px l={u * 2.2} t={u * 1.6} w={u * 3.6} h={u * 4.2} c="#d8c8a8" />
          <Px l={u * 2.6} t={u * 2} w={u * 2.8} h={u * 3.4} c="#4d7894" />
          <Px l={u * 2.6} t={u * 2} w={u * 1.1} h={u * 1.2} c="#a9d2e8" />
          <Px l={u * 3.9} t={u * 2} w={u * 0.25} h={u * 3.4} c="#d8c8a8" />
          <Px l={u * 2.6} t={u * 3.6} w={u * 2.8} h={u * 0.25} c="#d8c8a8" />
          <Px l={u * 0.6} t={u * 1.6} w={u * 1.5} h={u * 4.2} c="#2e6b3a" />
          <Px l={u * 5.9} t={u * 1.6} w={u * 1.5} h={u * 4.2} c="#2e6b3a" />
          {[2.3, 3.1, 3.9, 4.7].map((t) => (
            <React.Fragment key={t}>
              <Px l={u * 0.7} t={u * t} w={u * 1.3} h={u * 0.2} c="#1f4f2a" />
              <Px l={u * 6} t={u * t} w={u * 1.3} h={u * 0.2} c="#1f4f2a" />
            </React.Fragment>
          ))}
          <Px l={u * 2} t={u * 5.8} w={u * 4} h={u * 0.5} c="#b8a68e" />
          <Px l={0} t={u * 7.2} w={s} h={u * 0.8} c="#b9a47c" />
        </>
      );
      break;
    case "D":
      // Arched wooden door in a stone frame, with planks, knocker and a step.
      inner = (
        <>
          <Px l={u * 1.2} t={u * 0.6} w={u * 5.6} h={u * 6.8} c="#c9b48c" r={u * 2.8} />
          <Px l={u * 1.2} t={u * 3.5} w={u * 5.6} h={u * 3.9} c="#c9b48c" />
          <Px l={u * 1.8} t={u * 1.2} w={u * 4.4} h={u * 6.2} c="#6d4c41" r={u * 2.2} />
          <Px l={u * 1.8} t={u * 3.5} w={u * 4.4} h={u * 3.9} c="#6d4c41" />
          {[2.8, 3.9, 5].map((l) => <Px key={l} l={u * l} t={u * 1.6} w={u * 0.25} h={u * 5.8} c="#4e342e" />)}
          <Px l={u * 1.8} t={u * 1.4} w={u * 1} h={u * 0.4} c="#8d6e63" />
          <Px l={u * 4.5} t={u * 4.3} w={u * 0.7} h={u * 0.7} c="#fbc02d" r={u} />
          <Px l={u * 0.8} t={u * 7.3} w={u * 6.4} h={u * 0.7} c="#9c8a72" />
          <Px l={u * 0.8} t={u * 7.3} w={u * 6.4} h={u * 0.2} c="#cbbba3" />
        </>
      );
      break;
    case "B":
      // Brick wall: staggered bricks with varied tones and mortar.
      inner = (
        <>
          <Px l={0} t={0} w={s} h={s} c="#5e2414" />
          {[0, 2, 4, 6].map((ty) =>
            [-1, 2, 5, 8].map((bx) => {
              const l = (bx + ((ty / 2) % 2 ? 1.5 : 0)) * u;
              const v = hash(x * 5 + bx + 2, y * 4 + ty) % 3;
              return (
                <React.Fragment key={`${ty}${bx}`}>
                  <Px l={l + u * 0.15} t={ty * u + u * 0.15} w={u * 2.7} h={u * 1.7} c={["#9a4428", "#8d3b23", "#a8502f"][v]} />
                  <Px l={l + u * 0.15} t={ty * u + u * 0.15} w={u * 2.7} h={u * 0.3} c="#b8603e" />
                </React.Fragment>
              );
            }),
          )}
        </>
      );
      break;
'''
s = s[:start] + new_mid + s[end:]
s = s.replace("type P = { ch: string; size: number; x: number; y: number; phase: number };", "type P = { ch: string; size: number; x: number; y: number; phase: number; shadow?: boolean };")
s = s.replace("function TileArtBase({ ch, size: s, x, y, phase }: P) {", "function TileArtBase({ ch, size: s, x, y, phase, shadow }: P) {")
s = s.replace('''  return <View style={{ width: s, height: s, backgroundColor: bg, overflow: "hidden" }}>{inner}</View>;''', '''  return (
    <View style={{ width: s, height: s, backgroundColor: bg, overflow: "hidden" }}>
      {(ch === "," || ch === "F") && (x + y) % 2 === 0 && <Px l={0} t={0} w={s} h={s} c="rgba(255,255,255,0.05)" />}
      {inner}
      {shadow && (
        <>
          <Px l={0} t={0} w={s} h={u * 1.2} c="rgba(20,10,0,0.28)" />
          <Px l={0} t={u * 1.2} w={s} h={u * 0.6} c="rgba(20,10,0,0.12)" />
        </>
      )}
    </View>
  );''')
open(p, "w").write(s)
print("ok")
