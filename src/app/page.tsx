"use client";

import { useEffect, useMemo, useState } from "react";

// Types
type EntryType = "essential" | "skip";

type Entry = {
  id: string;
  type: EntryType;
  amount: number;
  note: string;
  createdAt: string;
};

type ChallengeMeta = {
  isActive: boolean;
  dayOfMonth: number;
  daysLeft: number;
  daysInMonth: number;
  daysUntilStart: number;
  year: number;
};

// localStorage utilities
const STORAGE_KEYS = {
  entries: "februar-challenge-entries",
  budget: "februar-challenge-budget",
};

function loadEntries(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.entries);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: Entry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
  } catch (error) {
    console.error("Failed to save entries:", error);
  }
}

function loadBudget(): number {
  if (typeof window === "undefined") return 4500;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.budget);
    return stored ? Number(stored) : 4500;
  } catch {
    return 4500;
  }
}

function saveBudget(budget: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.budget, String(budget));
  } catch (error) {
    console.error("Failed to save budget:", error);
  }
}

// Challenge logic
function getChallengeMeta(): ChallengeMeta {
  const now = new Date();
  const thisYearEnd = new Date(now.getFullYear(), 2, 0);
  const targetYear = now <= thisYearEnd ? now.getFullYear() : now.getFullYear() + 1;

  const start = new Date(targetYear, 1, 1); // February 1st
  const end = new Date(targetYear, 2, 0); // Last day of February

  const isActive = now >= start && now <= end;
  const dayOfMonth = isActive ? now.getDate() : 0;
  const daysInMonth = end.getDate();
  const daysLeft = isActive ? daysInMonth - dayOfMonth : daysInMonth;
  const daysUntilStart =
    !isActive && now < start
      ? Math.max(0, Math.ceil((start.getTime() - now.getTime()) / 86_400_000))
      : 0;

  return { isActive, dayOfMonth, daysLeft, daysInMonth, daysUntilStart, year: targetYear };
}

// Formatting functions
const formatCurrency = (value: number) =>
  value.toLocaleString("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  });

const formatDate = (isoString: string) =>
  new Intl.DateTimeFormat("da-DK", {
    day: "2-digit",
    month: "short",
  }).format(new Date(isoString));

// StatCard Component
function StatCard({
  label,
  value,
  detail,
  mood,
}: {
  label: string;
  value: string | number;
  detail: string;
  mood?: "positive" | "highlight" | "neutral";
}) {
  const accent =
    mood === "positive"
      ? "from-emerald-400/30 to-emerald-500/10 border-emerald-300/30"
      : mood === "highlight"
      ? "from-orange-300/30 to-orange-400/10 border-orange-200/30"
      : "from-white/15 to-white/5 border-white/10";

  return (
    <div className={`rounded-3xl border ${accent} bg-gradient-to-br p-4`}>
      <p className="text-xs uppercase tracking-wide text-slate-200">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="text-sm text-slate-300">{detail}</p>
    </div>
  );
}

// Main Component
export default function Home() {
  const challengeMeta = getChallengeMeta();
  const [budget, setBudget] = useState(4500);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [essentialAmount, setEssentialAmount] = useState("");
  const [essentialNote, setEssentialNote] = useState("");
  const [skipAmount, setSkipAmount] = useState("");
  const [skipNote, setSkipNote] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string>("Henter motiverende råd…");
  const [quote, setQuote] = useState<string>("Henter inspirerende citat…");
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    setEntries(loadEntries());
    setBudget(loadBudget());
    fetchAdvice();
    fetchQuote();
  }, []);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    if (entries.length > 0 || typeof window !== "undefined") {
      saveEntries(entries);
    }
  }, [entries]);

  // Save budget to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      saveBudget(budget);
    }
  }, [budget]);

  // Calculate totals
  const totals = useMemo(() => {
    const essentials = entries.filter((entry) => entry.type === "essential");
    const skips = entries.filter((entry) => entry.type === "skip");

    const essentialTotal = essentials.reduce((sum, entry) => sum + entry.amount, 0);
    const skipTotal = skips.reduce((sum, entry) => sum + entry.amount, 0);
    const dailyAllowance = budget / challengeMeta.daysInMonth;

    const activeDay = challengeMeta.isActive ? Math.max(challengeMeta.dayOfMonth, 1) : 1;
    const averageSpend = essentials.length ? essentialTotal / Math.max(activeDay, 1) : 0;

    const budgetTargetSoFar = challengeMeta.isActive ? dailyAllowance * activeDay : 0;
    const budgetDelta = budgetTargetSoFar - essentialTotal;
    const savedAmount = Math.max(budget - essentialTotal, 0) + skipTotal;

    return {
      essentialTotal,
      skipTotal,
      averageSpend,
      dailyAllowance,
      budgetDelta,
      budgetTargetSoFar,
      savedAmount,
    };
  }, [entries, budget, challengeMeta]);

  function resetMonth() {
    if (confirm("Er du sikker på at du vil nulstille alle poster?")) {
      setEntries([]);
      setEssentialAmount("");
      setEssentialNote("");
      setSkipAmount("");
      setSkipNote("");
      setValidation(null);
      saveEntries([]);
    }
  }

  function addEntry(type: EntryType, amountInput: string, noteInput: string) {
    const amount = Number(amountInput);
    const trimmedNote = noteInput.trim();

    if (!amount || amount <= 0) {
      setValidation("Beløbet skal være et positivt tal.");
      return;
    }

    if (!trimmedNote) {
      setValidation("Tilføj en kort note, så du husker konteksten.");
      return;
    }

    const newEntry: Entry = {
      id: crypto.randomUUID(),
      amount: Number(amount.toFixed(2)),
      note: trimmedNote,
      type,
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setValidation(null);

    if (type === "essential") {
      setEssentialAmount("");
      setEssentialNote("");
    } else {
      setSkipAmount("");
      setSkipNote("");
    }
  }

  async function fetchAdvice() {
    setAdviceLoading(true);
    try {
      const response = await fetch("https://api.adviceslip.com/advice", {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAdvice(data?.slip?.advice ?? "Hold fokus – hver krone tæller.");
    } catch (error) {
      console.error("Advice API error:", error);
      // Fallback råd hvis API fejler
      const fallbackAdvice = [
        "Hold fokus – hver krone tæller.",
        "Planlæg dine måltider for at undgå impulskøb.",
        "Gem kvitteringer og gennemgå dem regelmæssigt.",
        "Fejre små sejre holder dig motiveret.",
      ];
      const randomAdvice = fallbackAdvice[Math.floor(Math.random() * fallbackAdvice.length)];
      setAdvice(randomAdvice);
    } finally {
      setAdviceLoading(false);
    }
  }

  async function fetchQuote() {
    setQuoteLoading(true);
    try {
      const response = await fetch("https://api.quotable.io/random", {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setQuote(data?.content ? `"${data.content}" - ${data.author}` : "Sparsommelighed er en dyd.");
    } catch (error) {
      console.error("Quote API error:", error);
      // Fallback citater hvis API fejler
      const fallbackQuotes = [
        "Sparsommelighed er en dyd.",
        "Hver krone sparet er en krone tjent.",
        "Disciplin er nøglen til finansiel frihed.",
        "Små besparelser bliver til store resultater.",
      ];
      const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      setQuote(randomQuote);
    } finally {
      setQuoteLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-200">
              Februar spare-challenge {challengeMeta.year}
            </p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight text-yellow-400 sm:text-5xl">
              Din måned med stram disciplin
            </h1>
            <p className="mt-3 max-w-3xl text-lg text-slate-200">
              Hold styr på nødvendige køb, registrér fravalg af unødvendigheder og se dine besparelser
              vokse dag for dag.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-200">
              {challengeMeta.isActive
                ? `Dag ${challengeMeta.dayOfMonth} af ${challengeMeta.daysInMonth}`
                : challengeMeta.daysUntilStart > 0
                ? `Starter om ${challengeMeta.daysUntilStart} dage`
                : "Challenge afsluttet"}
            </span>
            <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
              Regler: Kun fornødenheder
            </span>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Samlet besparelse"
            value={formatCurrency(totals.savedAmount)}
            detail="Skippede køb + tilbageværende budget"
            mood="positive"
          />
          <StatCard
            label="Essentielt forbrug"
            value={formatCurrency(totals.essentialTotal)}
            detail={`Dagligt snit: ${formatCurrency(totals.averageSpend || 0)}`}
            mood="neutral"
          />
          <StatCard
            label="Skippede køb"
            value={formatCurrency(totals.skipTotal)}
            detail="Penge du lod blive i lommen"
            mood="highlight"
          />
          <StatCard
            label="Dage tilbage"
            value={challengeMeta.daysLeft}
            detail={challengeMeta.isActive ? "Bliv ved!" : "Planlæg menuer nu"}
            mood="neutral"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Kontrolpanelet</h2>
                  <p className="text-sm text-slate-200">
                    Registrér nødvendige køb og de fristelser, du hopper over.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-sm text-slate-100">
                    Månedens essentials-budget
                    <div className="text-lg font-semibold text-white">{formatCurrency(budget)}</div>
                  </div>
                  <button
                    onClick={resetMonth}
                    className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:border-red-400/60 hover:bg-red-500/20"
                  >
                    Nulstil poster
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-200">Fornødent køb</p>
                      <h3 className="text-lg font-semibold text-white">Log et køb</h3>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-50">
                      Tilladt
                    </span>
                  </div>
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addEntry("essential", essentialAmount, essentialNote);
                    }}
                  >
                    <div className="flex gap-3">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Beløb (DKK)"
                        value={essentialAmount}
                        onChange={(event) => setEssentialAmount(event.target.value)}
                        className="w-1/3 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none ring-emerald-300/40 focus:ring"
                      />
                      <input
                        type="text"
                        placeholder="Fx madvarer, medicin, transport"
                        value={essentialNote}
                        onChange={(event) => setEssentialNote(event.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none ring-emerald-300/40 focus:ring"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                    >
                      Tilføj nødvendigt køb
                    </button>
                  </form>
                </div>

                <div className="rounded-2xl border border-orange-300/25 bg-orange-300/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-100">Fristelse sprunget over</p>
                      <h3 className="text-lg font-semibold text-white">Log et fravalg</h3>
                    </div>
                    <span className="rounded-full bg-orange-300/20 px-3 py-1 text-xs text-orange-50">
                      Besparelse
                    </span>
                  </div>
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addEntry("skip", skipAmount, skipNote);
                    }}
                  >
                    <div className="flex gap-3">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Beløb (DKK)"
                        value={skipAmount}
                        onChange={(event) => setSkipAmount(event.target.value)}
                        className="w-1/3 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none ring-orange-300/40 focus:ring"
                      />
                      <input
                        type="text"
                        placeholder="Hvad sprang du over? (fx tøj, café, makeup)"
                        value={skipNote}
                        onChange={(event) => setSkipNote(event.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none ring-orange-300/40 focus:ring"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-orange-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-300"
                    >
                      Markér fristelse sprunget over
                    </button>
                  </form>
                </div>
              </div>

              {validation && (
                <p className="mt-4 rounded-xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {validation}
                </p>
              )}

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                    Seneste poster
                  </h3>
                  <div className="mt-3 flex flex-col gap-3">
                    {entries.length === 0 && (
                      <p className="text-sm text-slate-300">
                        Ingen poster endnu. Log dit første køb eller fravalg.
                      </p>
                    )}
                    {entries.slice(0, 5).map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {entry.type === "essential" ? "Essentielt køb" : "Fravalg"}
                          </p>
                          <p className="text-sm text-slate-200">{entry.note}</p>
                          <p className="text-xs text-slate-400">{formatDate(entry.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-base font-semibold ${
                              entry.type === "skip" ? "text-emerald-200" : "text-sky-100"
                            }`}
                          >
                            {formatCurrency(entry.amount)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {entry.type === "skip" ? "besparelse" : "forbrug"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                        Budgetpuls
                      </h3>
                      <p className="text-sm text-slate-200">
                        Dagligt loft: {formatCurrency(totals.dailyAllowance)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        totals.budgetDelta >= 0
                          ? "bg-emerald-500/20 text-emerald-100"
                          : "bg-red-500/20 text-red-100"
                      }`}
                    >
                      {totals.budgetDelta >= 0 ? "Under målet" : "Over målet"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Forbrug i alt</span>
                      <span>{formatCurrency(totals.essentialTotal)}</span>
                    </div>
                    <div className="relative h-3 overflow-hidden rounded-full bg-slate-800/80">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-sky-500 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (totals.essentialTotal / Math.max(totals.budgetTargetSoFar || budget, budget)) *
                              100,
                          ).toFixed(0)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Målt forbrug i dag</span>
                      <span>
                        {challengeMeta.isActive ? formatCurrency(totals.budgetTargetSoFar) : "Starter 1. feb"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-slate-200">
                    <p>
                      {challengeMeta.isActive ? (
                        totals.budgetDelta >= 0 ? (
                          <>
                            Du er {formatCurrency(totals.budgetDelta)} under den forventede kurve. Perfekt
                            disciplin!
                          </>
                        ) : (
                          <>
                            Du er {formatCurrency(Math.abs(totals.budgetDelta))} over målet. Hold igen de næste
                            dage.
                          </>
                        )
                      ) : (
                        <>Challenge starter snart – planlæg måltider og lav en liste over "ingen adgang"-køb.</>
                      )}
                    </p>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs uppercase tracking-wide text-slate-300">
                      Justér essentials-budget
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min="1500"
                        max="12000"
                        step="100"
                        value={budget}
                        onChange={(event) => setBudget(Number(event.target.value))}
                        className="w-full accent-emerald-400"
                      />
                      <div className="text-sm font-semibold text-white">{formatCurrency(budget)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold text-white">Reglerne</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li>✅ Kun fornødenheder: mad, medicin, transport, husleje, faste regninger.</li>
                <li>🚫 Ingen tøj, makeup, møbler eller "bare fordi"-køb.</li>
                <li>🧾 Gem kvitteringer og noter for at spotte mønstre.</li>
                <li>🔥 Log fravalg – de tæller direkte som besparelse.</li>
                <li>📅 Hver søndag: gennemgå ugen og justér budgettet hvis nødvendigt.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-sky-300/20 bg-sky-400/10 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Motivation (åbent API)</h3>
                  <p className="text-sm text-sky-50/80">Hentet fra api.adviceslip.com</p>
                </div>
                <button
                  onClick={fetchAdvice}
                  disabled={adviceLoading}
                  className="rounded-xl border border-white/20 bg-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {adviceLoading ? "Henter..." : "Opdatér"}
                </button>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/90">{advice}</p>
            </div>

            <div className="rounded-3xl border border-purple-300/20 bg-purple-400/10 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Inspiration (åbent API)</h3>
                  <p className="text-sm text-purple-50/80">Hentet fra api.quotable.io</p>
                </div>
                <button
                  onClick={fetchQuote}
                  disabled={quoteLoading}
                  className="rounded-xl border border-white/20 bg-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {quoteLoading ? "Henter..." : "Opdatér"}
                </button>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/90 italic">{quote}</p>
            </div>

            <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-5">
              <h3 className="text-lg font-semibold text-white">Mini tjekliste</h3>
              <ul className="mt-3 space-y-2 text-sm text-emerald-50/90">
                <li>• Meal-prep to go: plan 3-4 aftener ad gangen.</li>
                <li>• Skær abonnementer ned til det mest nødvendige i februar.</li>
                <li>• Skriv en "må ikke købe"-liste og tjek den før du køber noget.</li>
                <li>• Brug loggen til at fejre fravalg – motivation &gt; afsavn.</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
