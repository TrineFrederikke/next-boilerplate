# Februar Spare-Challenge App

En motiverende web-applikation designet til at hjælpe med årlig februar spare-challenge. Appen hjælper dig med at tracke udgifter på fornødenheder, registrere skippede køb, og følge dine besparelser med integration til åbne APIs for motivation.

## Funktioner

### 📊 Tracking System
- **Essentielle køb**: Log udgifter på fornødenheder (mad, medicin, transport, regninger)
- **Skippede køb**: Registrér fristelser der blev sprunget over (tøj, makeup, møbler, etc.)
- **Budget**: Justérbart månedsbudget for fornødenheder
- **Automatisk tidsstempler**: Alle entries får automatisk dato/tid

### 📈 Statistikker og Visualisering
- **Samlet besparelse**: Skippede køb + tilbageværende budget
- **Essentielt forbrug**: Total og dagligt gennemsnit
- **Budget tracking**: Progress bar der viser hvor meget af måneden der er brugt
- **Dage tilbage**: Tæller ned til månedens slutning

### 🌐 Åbne API Integrationer
- **Advice Slip API**: Motiverende råd og tips
- **Quotable API**: Inspirerende citater om sparsommelighed
- **Exchange Rate API**: Valutakurser for at sammenligne besparelser internationalt (valgfrit)

### 🎯 Motiverende Features
- **Achievement badges**: Unlock badges ved milepæle (fx "Spart 1000 kr", "7 dage i træk")
- **Progress milestones**: Fejring ved vigtige beløb
- **Daglige motivation**: Automatisk opdateret råd og citater
- **Visual feedback**: Farvekodede statistikker (grøn = god, rød = over budget)

### 🎨 UI/UX
- **Moderne design**: Mørkt tema med gradient baggrunde
- **Responsive**: Fungerer på mobil, tablet og desktop
- **Intuitiv navigation**: Klar struktur med statistikker øverst, input i midten
- **Regler panel**: Sidebar med challenge regler og tips

## Challenge Regler

- ✅ **Kun fornødenheder**: mad, medicin, transport, husleje, faste regninger
- 🚫 **Ingen unødvendigheder**: tøj, makeup, møbler eller "bare fordi"-køb
- 🧾 **Gem kvitteringer**: Noter for at spotte mønstre
- 🔥 **Log fravalg**: De tæller direkte som besparelse
- 📅 **Ugentlig gennemgang**: Hver søndag gennemgå ugen og justér budgettet hvis nødvendigt

## Teknisk Stack

- **Framework**: Next.js 16 med React 19
- **Styling**: Tailwind CSS
- **Sprog**: TypeScript
- **State Management**: React hooks (useState, useMemo)
- **Data Persistence**: localStorage (til at gemme entries og budget)

## Installation

1. Klon eller download projektet
2. Installer dependencies:

```bash
npm install
```

3. Start development serveren:

```bash
npm run dev
```

4. Åbn [http://localhost:3000](http://localhost:3000) i din browser

## Brugsinstruktioner

### Første gang
1. Åbn appen i din browser
2. Justér dit månedsbudget for fornødenheder ved hjælp af slideren
3. Appen gemmer automatisk alle data lokalt i din browser

### Under challenge måneden
1. **Log essentielle køb**: Når du køber noget nødvendigt (mad, medicin, etc.), indtast beløbet og en kort note
2. **Log skippede køb**: Når du springer en fristelse over (tøj, café, makeup, etc.), registrér beløbet du sparede
3. **Følg statistikkerne**: Se dine besparelser vokse dag for dag
4. **Hent motivation**: Klik på "Opdatér" i motivation panelet for nye råd og citater

### Efter challenge måneden
- Alle data gemmes lokalt og kan genbruges næste år
- Brug "Nulstil poster" knappen for at starte forfra

## API'er Brugt

- **Advice Slip API**: `https://api.adviceslip.com/advice`
- **Quotable API**: `https://api.quotable.io/random`
- **Exchange Rate API**: `https://api.exchangerate-api.com/v4/latest/DKK` (valgfrit)

Alle API'er er åbne og kræver ingen API-nøgler.

## Projektstruktur

```
src/app/
  ├── page.tsx              # Hovedside med alle komponenter
  ├── layout.tsx            # Root layout
  └── globals.css           # Global styling
```

## Udvikling

Projektet bruger Next.js App Router med TypeScript. Alle komponenter er bygget med React hooks og Tailwind CSS til styling.

### Build til produktion

```bash
npm run build
npm start
```

## Noter

- Appen gemmer data lokalt i browserens localStorage
- Data forsvinder hvis du rydder browser cache
- Appen er designet til at være motiverende og positiv - fejrer fravalg, ikke fokusere på afsavn
- Alle beløb formateres som DKK med dansk formatering

## Licens

Dette projekt er lavet til personlig brug.
