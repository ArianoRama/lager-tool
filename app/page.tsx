"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

type Mitarbeiter = {
  name: string;
  start: string;
  end: string;
  platz: string;
  stammplatz?: string;
};

type BandSlot = {
  start: string;
  end: string;
  mitarbeiterName: string;
};

const plaetze = [
  "1A",
  "1B",
  "2A",
  "2B",
  "3A",
  "3B",
  "4A",
  "4B",
  "5A",
  "5B",
  "6A",
  "6B",
  "7A",
  "7B",
  "8A",
  "8B",
];

const stundenOptionen = ["07", "08", "09", "10", "11", "12", "13", "14", "15"];

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function shuffleArray<T>(array: T[]) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateBandSlots(
  mitarbeiterListe: Mitarbeiter[],
  dayStart = "07:00",
  dayEnd = "15:00",
  intervalMinutes = 30
): BandSlot[] {
  const slots: BandSlot[] = [];
  const startMinutes = timeToMinutes(dayStart);
  const endMinutes = timeToMinutes(dayEnd);

  const einsaetze: Record<string, number> = {};
  mitarbeiterListe.forEach((m) => {
    einsaetze[m.name] = 0;
  });

  let letzterMitarbeiter = "";

  for (let current = startMinutes; current < endMinutes; current += intervalMinutes) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + intervalMinutes);

    const verfuegbareMitarbeiter = mitarbeiterListe.filter((m) => {
      return (
        timeToMinutes(m.start) <= current &&
        timeToMinutes(m.end) >= current + intervalMinutes
      );
    });

    if (verfuegbareMitarbeiter.length === 0) {
      slots.push({
        start: slotStart,
        end: slotEnd,
        mitarbeiterName: "Niemand verfügbar",
      });
      letzterMitarbeiter = "";
      continue;
    }

    const ohneLetzten = verfuegbareMitarbeiter.filter(
      (m) => m.name !== letzterMitarbeiter
    );

    const kandidaten = ohneLetzten.length > 0 ? ohneLetzten : verfuegbareMitarbeiter;

    kandidaten.sort((a, b) => einsaetze[a.name] - einsaetze[b.name]);

    const ausgewaehlt = kandidaten[0];

    slots.push({
      start: slotStart,
      end: slotEnd,
      mitarbeiterName: ausgewaehlt.name,
    });

    einsaetze[ausgewaehlt.name] += 1;
    letzterMitarbeiter = ausgewaehlt.name;
  }

  return slots;
}

function generateRandomBandSlots(
  mitarbeiterListe: Mitarbeiter[],
  dayStart = "07:00",
  dayEnd = "15:00",
  intervalMinutes = 30
): BandSlot[] {
  const slots: BandSlot[] = [];
  const startMinutes = timeToMinutes(dayStart);
  const endMinutes = timeToMinutes(dayEnd);

  const einsaetze: Record<string, number> = {};
  mitarbeiterListe.forEach((m) => {
    einsaetze[m.name] = 0;
  });

  let letzterMitarbeiter = "";

  for (let current = startMinutes; current < endMinutes; current += intervalMinutes) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + intervalMinutes);

    const verfuegbareMitarbeiter = mitarbeiterListe.filter((m) => {
      return (
        timeToMinutes(m.start) <= current &&
        timeToMinutes(m.end) >= current + intervalMinutes
      );
    });

    if (verfuegbareMitarbeiter.length === 0) {
      slots.push({
        start: slotStart,
        end: slotEnd,
        mitarbeiterName: "Niemand verfügbar",
      });
      letzterMitarbeiter = "";
      continue;
    }

    const ohneLetzten = verfuegbareMitarbeiter.filter(
      (m) => m.name !== letzterMitarbeiter
    );

    const kandidaten = ohneLetzten.length > 0 ? ohneLetzten : verfuegbareMitarbeiter;

    const minEinsaetze = Math.min(...kandidaten.map((m) => einsaetze[m.name]));
    const besteKandidaten = kandidaten.filter((m) => einsaetze[m.name] === minEinsaetze);
    const gemischt = shuffleArray(besteKandidaten);
    const ausgewaehlt = gemischt[0];

    slots.push({
      start: slotStart,
      end: slotEnd,
      mitarbeiterName: ausgewaehlt.name,
    });

    einsaetze[ausgewaehlt.name] += 1;
    letzterMitarbeiter = ausgewaehlt.name;
  }

  return slots;
}

export default function Home() {
  const [name, setName] = useState("");
  const [startStunde, setStartStunde] = useState("07");
  const [endStunde, setEndStunde] = useState("15");
  const [stammplatz, setStammplatz] = useState("");

  const [aktuelleUhrzeit, setAktuelleUhrzeit] = useState("");
  const [testModus, setTestModus] = useState(false);
  const [testZeit, setTestZeit] = useState("09:15");

  const [mitarbeiterListe, setMitarbeiterListe] = useState<Mitarbeiter[]>([]);
  const [bekannteNamen, setBekannteNamen] = useState<string[]>([]);
  const [orangePlaetze, setOrangePlaetze] = useState<Record<string, number>>({});
  const [bandPlan, setBandPlan] = useState<BandSlot[]>([]);
  const [lagerleitung, setLagerleitung] = useState("");

  useEffect(() => {
    setAktuelleUhrzeit(getCurrentTimeString());

    const interval = setInterval(() => {
      setAktuelleUhrzeit(getCurrentTimeString());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const gespeicherteNamen = localStorage.getItem("bekannteNamen");
    if (gespeicherteNamen) {
      setBekannteNamen(JSON.parse(gespeicherteNamen));
    }

    const gespeicherteMitarbeiter = localStorage.getItem("mitarbeiterListe");
    if (gespeicherteMitarbeiter) {
      setMitarbeiterListe(JSON.parse(gespeicherteMitarbeiter));
    }

    const gespeicherteOrangePlaetze = localStorage.getItem("orangePlaetze");
    if (gespeicherteOrangePlaetze) {
      setOrangePlaetze(JSON.parse(gespeicherteOrangePlaetze));
    }

    const gespeicherterBandPlan = localStorage.getItem("bandPlan");
    if (gespeicherterBandPlan) {
      setBandPlan(JSON.parse(gespeicherterBandPlan));
    }

    const gespeicherteLagerleitung = localStorage.getItem("lagerleitung");
    if (gespeicherteLagerleitung) {
      setLagerleitung(gespeicherteLagerleitung);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bekannteNamen", JSON.stringify(bekannteNamen));
  }, [bekannteNamen]);

  useEffect(() => {
    localStorage.setItem("mitarbeiterListe", JSON.stringify(mitarbeiterListe));
  }, [mitarbeiterListe]);

  useEffect(() => {
    localStorage.setItem("orangePlaetze", JSON.stringify(orangePlaetze));
  }, [orangePlaetze]);

  useEffect(() => {
    localStorage.setItem("bandPlan", JSON.stringify(bandPlan));
  }, [bandPlan]);

  useEffect(() => {
    localStorage.setItem("lagerleitung", lagerleitung);
  }, [lagerleitung]);

  useEffect(() => {
    const interval = setInterval(() => {
      const jetzt = Date.now();

      setOrangePlaetze((prev) => {
        const neueEintraege = Object.entries(prev).filter(
          ([, endetUm]) => endetUm > jetzt
        );
        return Object.fromEntries(neueEintraege);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const autoBandPlan = useMemo(() => {
    return generateBandSlots(mitarbeiterListe);
  }, [mitarbeiterListe]);

  useEffect(() => {
    if (bandPlan.length === 0 && autoBandPlan.length > 0) {
      setBandPlan(autoBandPlan);
    }
  }, [autoBandPlan, bandPlan.length]);

  useEffect(() => {
    const aktuelleMitarbeiterNamen = mitarbeiterListe.map((m) => m.name);

    const ungueltigerSlotGefunden =
      bandPlan.length > 0 &&
      bandPlan.some((slot) => {
        return (
          slot.mitarbeiterName !== "Niemand verfügbar" &&
          !aktuelleMitarbeiterNamen.includes(slot.mitarbeiterName)
        );
      });

    if (bandPlan.length !== autoBandPlan.length || ungueltigerSlotGefunden) {
      setBandPlan(autoBandPlan);
    }
  }, [mitarbeiterListe, bandPlan, autoBandPlan]);

  const angezeigteUhrzeit = testModus ? testZeit : aktuelleUhrzeit;

  const getNaechstenFreienPlatz = (belegtePlaetze: string[]) => {
    return plaetze.find((platz) => !belegtePlaetze.includes(platz));
  };

  const handleAdd = () => {
    const bereinigterName = name.trim();
    const bereinigterStammplatz = stammplatz.trim().toUpperCase();

    if (!bereinigterName || !startStunde || !endStunde) {
      alert("Bitte Name, Start und Ende eingeben.");
      return;
    }

    if (mitarbeiterListe.length >= plaetze.length) {
      alert("Alle 16 Plätze sind bereits belegt.");
      return;
    }

    const start = `${startStunde}:00`;
    const end = `${endStunde}:00`;

    if (timeToMinutes(start) >= timeToMinutes(end)) {
      alert("Die Endzeit muss nach der Startzeit liegen.");
      return;
    }

    const belegtePlaetze = mitarbeiterListe.map((m) => m.platz);

    let finalerPlatz = "";

    if (bereinigterStammplatz) {
      if (!plaetze.includes(bereinigterStammplatz)) {
        alert("Ungültiger Stammplatz. Bitte z. B. 1A, 3B oder 6B eingeben.");
        return;
      }

      if (belegtePlaetze.includes(bereinigterStammplatz)) {
        alert(`Der Platz ${bereinigterStammplatz} ist bereits belegt.`);
        return;
      }

      finalerPlatz = bereinigterStammplatz;
    } else {
      const freierPlatz = getNaechstenFreienPlatz(belegtePlaetze);

      if (!freierPlatz) {
        alert("Kein freier Platz mehr verfügbar.");
        return;
      }

      finalerPlatz = freierPlatz;
    }

    const neuerMitarbeiter: Mitarbeiter = {
      name: bereinigterName,
      start,
      end,
      platz: finalerPlatz,
      stammplatz: bereinigterStammplatz || undefined,
    };

    setMitarbeiterListe([...mitarbeiterListe, neuerMitarbeiter]);

    const nameExistiertSchon = bekannteNamen.some(
      (n) => n.toLowerCase() === bereinigterName.toLowerCase()
    );

    if (!nameExistiertSchon) {
      setBekannteNamen([...bekannteNamen, bereinigterName]);
    }

    setName("");
    setStartStunde("07");
    setEndStunde("15");
    setStammplatz("");
  };

  const handleDelete = (indexToDelete: number) => {
    const neueListe = mitarbeiterListe.filter((_, index) => index !== indexToDelete);
    setMitarbeiterListe(neueListe);
  };

  const handlePlatzChange = (indexToUpdate: number, neuerPlatz: string) => {
    const bereinigterPlatz = neuerPlatz.toUpperCase();

    if (!plaetze.includes(bereinigterPlatz)) {
      alert("Ungültiger Platz.");
      return;
    }

    const platzSchonBelegt = mitarbeiterListe.some((m, index) => {
      return index !== indexToUpdate && m.platz === bereinigterPlatz;
    });

    if (platzSchonBelegt) {
      alert(`Der Platz ${bereinigterPlatz} ist bereits belegt.`);
      return;
    }

    const alterPlatz = mitarbeiterListe[indexToUpdate].platz;

    if (alterPlatz === bereinigterPlatz) {
      return;
    }

    const neueListe = [...mitarbeiterListe];
    neueListe[indexToUpdate] = {
      ...neueListe[indexToUpdate],
      platz: bereinigterPlatz,
    };

    setMitarbeiterListe(neueListe);

    const jetzt = Date.now();
    const fuenfMinuten = 5 * 60 * 1000;

    setOrangePlaetze((prev) => ({
      ...prev,
      [bereinigterPlatz]: jetzt + fuenfMinuten,
    }));
  };

  const handleBandMitarbeiterChange = (slotIndex: number, neuerName: string) => {
    const neueSlots = [...bandPlan];
    neueSlots[slotIndex] = {
      ...neueSlots[slotIndex],
      mitarbeiterName: neuerName,
    };
    setBandPlan(neueSlots);
  };

  const handleBandPlanZuruecksetzen = () => {
    setBandPlan(autoBandPlan);
  };

  const handleBandNeuMischen = () => {
    const neuerBandPlan = generateRandomBandSlots(mitarbeiterListe);
    setBandPlan(neuerBandPlan);
  };

  const handleTischNeuMischen = () => {
    const jetzt = Date.now();
    const fuenfMinuten = 5 * 60 * 1000;

    const festeMitarbeiter = mitarbeiterListe.filter(
      (m) => m.stammplatz && plaetze.includes(m.stammplatz)
    );

    const variableMitarbeiter = mitarbeiterListe.filter((m) => !m.stammplatz);

    const festePlaetze = festeMitarbeiter.map((m) => m.platz);
    const freiePlaetze = plaetze.filter((platz) => !festePlaetze.includes(platz));

    const gemischteMitarbeiter = shuffleArray(variableMitarbeiter);

    const altePlaetzeMap = new Map(mitarbeiterListe.map((m) => [m.name, m.platz]));

    const neueVariableMitarbeiter = gemischteMitarbeiter.map((m, index) => ({
      ...m,
      platz: freiePlaetze[index],
    }));

    const neueListe = [...festeMitarbeiter, ...neueVariableMitarbeiter].sort(
      (a, b) => plaetze.indexOf(a.platz) - plaetze.indexOf(b.platz)
    );

    const neueOrange: Record<string, number> = {};
    neueListe.forEach((m) => {
      const alterPlatz = altePlaetzeMap.get(m.name);
      if (alterPlatz && alterPlatz !== m.platz) {
        neueOrange[m.platz] = jetzt + fuenfMinuten;
      }
    });

    setMitarbeiterListe(neueListe);
    setOrangePlaetze((prev) => ({
      ...prev,
      ...neueOrange,
    }));
  };

  const handleExcelDownload = () => {
    const rows: string[][] = Array.from({ length: 30 }, () =>
      Array.from({ length: 6 }, () => "")
    );

    rows[0][0] = "Tischordnung";
    rows[0][3] = "Band";

    rows[2][0] = "Tisch";
    rows[2][1] = "Name";
    rows[2][3] = "Band";
    rows[2][4] = "Name";

    plaetze.forEach((platz, index) => {
      const rowIndex = 4 + index;
      const mitarbeiter = mitarbeiterListe.find((m) => m.platz === platz);
      rows[rowIndex][0] = platz;
      rows[rowIndex][1] = mitarbeiter?.name ?? "";
    });

    bandPlan.forEach((slot, index) => {
      const rowIndex = 4 + index;
      rows[rowIndex][3] = `${slot.start}-${slot.end}`;
      rows[rowIndex][4] =
        slot.mitarbeiterName === "Niemand verfügbar" ? "" : slot.mitarbeiterName;
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws["!cols"] = [
      { wch: 12 },
      { wch: 18 },
      { wch: 4 },
      { wch: 14 },
      { wch: 18 },
      { wch: 4 },
    ];

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 0, c: 3 }, e: { r: 0, c: 4 } },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plan");
    XLSX.writeFile(wb, "lager-planung.xlsx");
  };

  const aktuellerSlotIndex = useMemo(() => {
    if (!angezeigteUhrzeit) return -1;

    const jetzt = timeToMinutes(angezeigteUhrzeit);

    return bandPlan.findIndex((slot) => {
      return timeToMinutes(slot.start) <= jetzt && jetzt < timeToMinutes(slot.end);
    });
  }, [angezeigteUhrzeit, bandPlan]);

  const aktuellerSlot = aktuellerSlotIndex >= 0 ? bandPlan[aktuellerSlotIndex] : null;
  const naechsterSlot =
    aktuellerSlotIndex >= 0 && aktuellerSlotIndex < bandPlan.length - 1
      ? bandPlan[aktuellerSlotIndex + 1]
      : null;

  const platzBelegung = useMemo(() => {
    return plaetze.map((platz) => {
      const mitarbeiter = mitarbeiterListe.find((m) => m.platz === platz);
      return {
        platz,
        mitarbeiterName: mitarbeiter ? mitarbeiter.name : "Frei",
      };
    });
  }, [mitarbeiterListe]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Lager Planung</h1>

      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Lagerleitung</h2>
        <input
          type="text"
          placeholder="Name eingeben..."
          value={lagerleitung}
          onChange={(e) => setLagerleitung(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>

      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Mitarbeiter hinzufügen</h2>

        <div className="grid grid-cols-4 gap-3">
          <div>
            <input
              list="namen-vorschlaege"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <datalist id="namen-vorschlaege">
              {bekannteNamen.map((bekannterName) => (
                <option key={bekannterName} value={bekannterName} />
              ))}
            </datalist>
          </div>

          <select
            value={startStunde}
            onChange={(e) => setStartStunde(e.target.value)}
            className="border p-2 rounded"
          >
            {stundenOptionen.map((stunde) => (
              <option key={stunde} value={stunde}>
                {stunde}:00
              </option>
            ))}
          </select>

          <select
            value={endStunde}
            onChange={(e) => setEndStunde(e.target.value)}
            className="border p-2 rounded"
          >
            {stundenOptionen.map((stunde) => (
              <option key={stunde} value={stunde}>
                {stunde}:00
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Stammplatz z. B. 6B"
            value={stammplatz}
            onChange={(e) => setStammplatz(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={handleAdd}
          className="mt-4 bg-black text-white px-4 py-2 rounded"
        >
          Mitarbeiter hinzufügen
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleBandNeuMischen}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Band neu mischen
          </button>

          <button
            onClick={handleTischNeuMischen}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Tische neu mischen
          </button>

          <button
            onClick={handleExcelDownload}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Excel herunterladen
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Mitarbeiter Liste (heute)</h2>

        {mitarbeiterListe.length === 0 ? (
          <p className="text-gray-500">Noch keine Mitarbeiter hinzugefügt</p>
        ) : (
          <ul className="space-y-2">
            {mitarbeiterListe.map((m, index) => (
              <li
                key={index}
                className="border p-3 rounded flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-sm text-gray-600">
                    {m.start} - {m.end}
                  </div>

                  <div className="mt-2">
                    <label className="text-sm font-semibold mr-2">Platz:</label>
                    <select
                      value={m.platz}
                      onChange={(e) => handlePlatzChange(index, e.target.value)}
                      className="border p-1 rounded text-sm"
                    >
                      {plaetze.map((platzOption) => (
                        <option key={platzOption} value={platzOption}>
                          {platzOption}
                        </option>
                      ))}
                    </select>
                  </div>

                  {m.stammplatz && (
                    <div className="text-sm text-blue-600 mt-1">
                      Stammplatz: {m.stammplatz}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(index)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Löschen
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Banddienst Live</h2>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={testModus}
              onChange={(e) => setTestModus(e.target.checked)}
            />
            <span>Testmodus aktivieren</span>
          </label>

          {testModus && (
            <input
              type="time"
              value={testZeit}
              onChange={(e) => setTestZeit(e.target.value)}
              className="border p-2 rounded"
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-xl p-4 bg-gray-50">
            <div className="text-sm text-gray-500 mb-1">
              {testModus ? "Test-Uhrzeit" : "Aktuelle Uhrzeit"}
            </div>
            <div className="text-2xl font-bold">
              {angezeigteUhrzeit || "--:--"}
            </div>
          </div>

          <div className="border rounded-xl p-4 bg-red-50">
            <div className="text-sm text-gray-500 mb-1">Aktuell am Band</div>
            <div className="text-lg font-bold">
              {aktuellerSlot ? aktuellerSlot.mitarbeiterName : "Gerade kein Slot"}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {aktuellerSlot ? `${aktuellerSlot.start} - ${aktuellerSlot.end}` : "-"}
            </div>
          </div>

          <div className="border rounded-xl p-4 bg-orange-50">
            <div className="text-sm text-gray-500 mb-1">Als Nächstes am Band</div>
            <div className="text-lg font-bold">
              {naechsterSlot ? naechsterSlot.mitarbeiterName : "Kein nächster Slot"}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {naechsterSlot ? `${naechsterSlot.start} - ${naechsterSlot.end}` : "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Platzübersicht</h2>

        <div className="grid grid-cols-4 gap-4">
          {platzBelegung.map((platz) => {
            const istAktuellAmBand =
              !!aktuellerSlot && platz.mitarbeiterName === aktuellerSlot.mitarbeiterName;

            const istOrange =
              !!orangePlaetze[platz.platz] && orangePlaetze[platz.platz] > Date.now();

            return (
              <div
                key={platz.platz}
                className={`border rounded-xl p-4 min-h-[110px] ${
                  istAktuellAmBand
                    ? "bg-red-100 border-red-400"
                    : istOrange
                    ? "bg-orange-100 border-orange-400"
                    : "bg-gray-50"
                }`}
              >
                <div className="text-lg font-bold mb-2">{platz.platz}</div>
                <div
                  className={
                    platz.mitarbeiterName === "Frei"
                      ? "text-gray-400"
                      : "text-black font-medium"
                  }
                >
                  {platz.mitarbeiterName}
                </div>

                {istAktuellAmBand && (
                  <div className="text-sm text-red-700 font-semibold mt-2">
                    Aktuell am Band
                  </div>
                )}

                {!istAktuellAmBand && istOrange && (
                  <div className="text-sm text-orange-700 font-semibold mt-2">
                    Platzwechsel / Aufräumen
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Banddienst Plan</h2>
          <button
            onClick={handleBandPlanZuruecksetzen}
            className="bg-gray-800 text-white px-3 py-1 rounded text-sm"
          >
            Automatik wiederherstellen
          </button>
        </div>

        {mitarbeiterListe.length === 0 ? (
          <p className="text-gray-500">Noch keine Mitarbeiter vorhanden</p>
        ) : (
          <ul className="space-y-2">
            {bandPlan.map((slot, index) => {
              const istAktuell = index === aktuellerSlotIndex;

              return (
                <li
                  key={index}
                  className={`border p-3 rounded flex justify-between items-center ${
                    istAktuell ? "bg-red-50 border-red-300" : ""
                  }`}
                >
                  <span className="font-medium">
                    {slot.start} - {slot.end}
                  </span>

                  <select
                    value={slot.mitarbeiterName}
                    onChange={(e) => handleBandMitarbeiterChange(index, e.target.value)}
                    className="border p-2 rounded"
                  >
                    {slot.mitarbeiterName === "Niemand verfügbar" && (
                      <option value="Niemand verfügbar">Niemand verfügbar</option>
                    )}

                    {mitarbeiterListe.map((mitarbeiter) => (
                      <option key={mitarbeiter.name} value={mitarbeiter.name}>
                        {mitarbeiter.name}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}