"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function MonitorPage() {
  const [aktuelleUhrzeit, setAktuelleUhrzeit] = useState("");
  const [mitarbeiterListe, setMitarbeiterListe] = useState<Mitarbeiter[]>([]);
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
    const ladeDaten = () => {
      const gespeicherteMitarbeiter = localStorage.getItem("mitarbeiterListe");
      const gespeicherteOrangePlaetze = localStorage.getItem("orangePlaetze");
      const gespeicherterBandPlan = localStorage.getItem("bandPlan");
      const gespeicherteLagerleitung = localStorage.getItem("lagerleitung");

      if (gespeicherteMitarbeiter) {
        setMitarbeiterListe(JSON.parse(gespeicherteMitarbeiter));
      } else {
        setMitarbeiterListe([]);
      }

      if (gespeicherteOrangePlaetze) {
        setOrangePlaetze(JSON.parse(gespeicherteOrangePlaetze));
      } else {
        setOrangePlaetze({});
      }

      if (gespeicherterBandPlan) {
        setBandPlan(JSON.parse(gespeicherterBandPlan));
      } else if (gespeicherteMitarbeiter) {
        const mitarbeiter = JSON.parse(gespeicherteMitarbeiter) as Mitarbeiter[];
        setBandPlan(generateBandSlots(mitarbeiter));
      } else {
        setBandPlan([]);
      }

      if (gespeicherteLagerleitung) {
        setLagerleitung(gespeicherteLagerleitung);
      } else {
        setLagerleitung("");
      }
    };

    ladeDaten();

    const interval = setInterval(() => {
      ladeDaten();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const aktuellerSlotIndex = useMemo(() => {
    if (!aktuelleUhrzeit) return -1;

    const jetzt = timeToMinutes(aktuelleUhrzeit);

    return bandPlan.findIndex((slot) => {
      return timeToMinutes(slot.start) <= jetzt && jetzt < timeToMinutes(slot.end);
    });
  }, [aktuelleUhrzeit, bandPlan]);

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
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Lager Monitor</h1>
          {lagerleitung && (
            <div className="text-lg text-gray-600 mt-2">
              Lagerleitung: <span className="font-semibold">{lagerleitung}</span>
            </div>
          )}
        </div>

        <div className="text-3xl font-bold">{aktuelleUhrzeit || "--:--"}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl border bg-red-50 p-6 shadow">
          <div className="text-sm text-gray-500 mb-2">Aktuell am Band</div>
          <div className="text-3xl font-bold">
            {aktuellerSlot ? aktuellerSlot.mitarbeiterName : "Gerade kein Slot"}
          </div>
          <div className="text-lg text-gray-600 mt-2">
            {aktuellerSlot ? `${aktuellerSlot.start} - ${aktuellerSlot.end}` : "-"}
          </div>
        </div>

        <div className="rounded-2xl border bg-orange-50 p-6 shadow">
          <div className="text-sm text-gray-500 mb-2">Als Nächstes am Band</div>
          <div className="text-3xl font-bold">
            {naechsterSlot ? naechsterSlot.mitarbeiterName : "Kein nächster Slot"}
          </div>
          <div className="text-lg text-gray-600 mt-2">
            {naechsterSlot ? `${naechsterSlot.start} - ${naechsterSlot.end}` : "-"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold mb-6">Platzübersicht</h2>

        <div className="grid grid-cols-4 gap-4">
          {platzBelegung.map((platz) => {
            const istAktuellAmBand =
              !!aktuellerSlot && platz.mitarbeiterName === aktuellerSlot.mitarbeiterName;

            const istOrange =
              !!orangePlaetze[platz.platz] && orangePlaetze[platz.platz] > Date.now();

            return (
              <div
                key={platz.platz}
                className={`rounded-2xl border p-5 min-h-[130px] ${
                  istAktuellAmBand
                    ? "bg-red-100 border-red-400"
                    : istOrange
                    ? "bg-orange-100 border-orange-400"
                    : "bg-slate-50"
                }`}
              >
                <div className="text-2xl font-bold mb-3">{platz.platz}</div>
                <div
                  className={
                    platz.mitarbeiterName === "Frei"
                      ? "text-gray-400 text-lg"
                      : "text-xl font-semibold"
                  }
                >
                  {platz.mitarbeiterName}
                </div>

                {istAktuellAmBand && (
                  <div className="mt-3 text-red-700 font-semibold">
                    Aktuell am Band
                  </div>
                )}

                {!istAktuellAmBand && istOrange && (
                  <div className="mt-3 text-orange-700 font-semibold">
                    Platzwechsel / Aufräumen
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}