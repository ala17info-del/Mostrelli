// Where a new adventure starts: the player picks a province; the starter Mostrello is the local one.
import { MAPS, SPECIES } from "./data";

export type Zone = { prov: string; label: string; map: string; starter: string; blurb: string };
export const ZONES: Zone[] = [
  { prov: "PC", label: "Piacenza", map: "piacenza", starter: "pisarello", blurb: "Colli, castelli e pisarei e fasö." },
  { prov: "PR", label: "Parma", map: "parma", starter: "anolino", blurb: "Anolini in brodo e opera al Regio." },
  { prov: "RE", label: "Reggio Emilia", map: "reggio_emilia", starter: "erbazzino", blurb: "Erbazzone e la città del Tricolore." },
  { prov: "MO", label: "Modena", map: "modena", starter: "gnocchino", blurb: "Gnocco fritto, aceto e motori." },
  { prov: "BO", label: "Bologna", map: "bologna", starter: "tortellotto", blurb: "Portici, tortellini e umarell." },
  { prov: "FE", label: "Ferrara", map: "ferrara", starter: "anguillina", blurb: "Biciclette, nebbia e valli." },
  { prov: "RA", label: "Ravenna", map: "ravenna", starter: "ceramichino", blurb: "Mosaici, ceramiche e pinete." },
  { prov: "FC", label: "Forlì-Cesena", map: "forli", starter: "lisciolo", blurb: "Liscio, Sangiovese e colline." },
  { prov: "RN", label: "Rimini", map: "rimini", starter: "piadinetta", blurb: "Mare, piadina e balere." },
].filter((z) => MAPS[z.map] && SPECIES[z.starter]);

/** Starter level fits the zone: far-away provinces have stronger wild Mostrelli. */
export const startLevel = (z: Zone) => Math.max(5, Math.min(...MAPS[z.map].wild.map((w) => w[1])) - 1);
