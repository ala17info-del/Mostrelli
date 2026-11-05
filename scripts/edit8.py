def edit(p, R):
    s = open(p).read()
    for a, b in R:
        assert a in s, (p, a[:80])
        s = s.replace(a, b, 1)
    open(p, 'w').write(s)

edit('/app/frontend/app/game.tsx', [
('justifyContent: "space-between", paddingHorizontal: 20,', 'justifyContent: "space-between", paddingHorizontal: 10,'),
('dBtn: { width: 58, height: 58,', 'dBtn: { width: 50, height: 50,'),
('dCenter: { width: 58, height: 58,', 'dCenter: { width: 50, height: 50,'),
('round: { width: 68, height: 68,', 'round: { width: 58, height: 58,'),
('ab: { flexDirection: "row", gap: 16,', 'ab: { flexDirection: "row", gap: 10,'),
('menuPill: { alignItems: "center", justifyContent: "center", gap: 2, width: 64,', 'menuPill: { alignItems: "center", justifyContent: "center", gap: 2, width: 54,'),
('${save.items.caffe ?? 0} caffè`}', '${save.items.caffe ?? 0} caffè · ${save.items.digestivo ?? 0} digestivi · ${save.items.gelato ?? 0} gelati`}'),
])
edit('/app/frontend/app/team.tsx', [
('{save.items.caffe ?? 0} caffè · {save.money} €</PixelText>', '''{save.items.caffe ?? 0} caffè · {save.items.digestivo ?? 0} digestivi · {save.items.gelato ?? 0} gelati · {save.money} €</PixelText>
        <PixelText style={styles.meta}>Digestivo e Gelato: usabili solo in lotta.</PixelText>'''),
])
edit('/app/backend/server.py', [
('''        email = (claims.get("email") or body.email or f"apple_{sub}@privaterelay.local").lower()
        existing = await db.users.find_one({"email": email})''', '''        verified_email = claims.get("email")
        email = (verified_email or f"apple_{sub}@privaterelay.local").lower()
        existing = await db.users.find_one({"email": email}) if verified_email else None'''),
('''        key = _apple_jwks.get_signing_key_from_jwt(body.identity_token).key''', '''        key = (await asyncio.to_thread(_apple_jwks.get_signing_key_from_jwt, body.identity_token)).key'''),
('''@api_router.post("/duel")
async def create_duel(body: DuelIn, user: dict = Depends(current_user)):''', '''SPECIES_IDS = {
    "tortellotto", "fanghino", "grappolino", "mortazzone", "umarellino", "zanzarone", "nebbiolone", "salamone", "biciclone",
    "pistonzo", "vaporella", "cinghialotto", "squacquerone", "piadinone", "passatellone", "portichino", "tortellone", "fangone",
    "vendemmione", "umarellone", "cinghialone", "gabbianone", "vongolino", "medusella", "discotecco", "ombrellone",
    "crescentino", "lambruschino", "canalino", "scooterone", "cappellaccio", "zuppone",
}


@api_router.post("/duel")
async def create_duel(body: DuelIn, user: dict = Depends(current_user)):
    clean = []
    for m in body.party:
        s, lv = m.get("s"), m.get("lv")
        if s not in SPECIES_IDS or not isinstance(lv, int) or not 1 <= lv <= 50:
            raise HTTPException(status_code=422, detail="Squadra non valida")
        clean.append({"uid": str(m.get("uid", ""))[:16], "s": s, "lv": lv, "xp": lv ** 3, "hp": 1})
    body.party = clean'''),
('''    if not d or d["user_id"] == str(user["_id"]):
        raise HTTPException(status_code=404, detail="Codice sfida non trovato")
    await db.duels.update_one({"_id": d["_id"]}, {"$inc": {"losses" if body.won else "wins": 1}})''', '''    if not d or d["user_id"] == str(user["_id"]):
        raise HTTPException(status_code=404, detail="Codice sfida non trovato")
    uid = str(user["_id"])
    if uid in d.get("reported_by", []):
        return {"ok": True, "counted": False}
    await db.duels.update_one({"_id": d["_id"]}, {"$inc": {"losses" if body.won else "wins": 1}, "$push": {"reported_by": uid}})'''),
])
print("ok")
