# Björns mattebilder - Konvertera matematiska ekvationer till bilder

En enkel webbapplikation som konverterar matematiska ekvationer skrivna med användarvänlig syntax till nedladdningsbara PNG- eller JPG-bilder.

## Funktioner (Översikt)

- **Enkel syntax**: Använd vanliga tangentbordssymboler istället för komplex LaTeX
- **Realtidsförhandsvisning**: Se din ekvation renderad medan du skriver
- **Flera format**: Ladda ner som PNG (med transparens) eller JPG
- **Mobilvänlig**: Responsiv design som fungerar på alla enheter
- **Exempelbibliotek**: Klicka på exempel för att lära dig syntaxen

## Syntax som stöds

### Grundläggande operationer

- **Potenser**: `x^2` → x²
- **Nedsänkt text**: `x_1` → x₁
- **Bråk**: `a/b` eller `(x+1)/(x-1)` → riktiga bråk
- **Kvadratrot**: `sqrt(x)` → √x
- **Multiplikation**: `2*x` eller `2x` → 2x

### Funktioner (matematiska)

- Trigonometriska: `sin(x)`, `cos(x)`, `tan(x)`, osv.
- Logaritmiska: `log(x)`, `ln(x)`
- Exponentiella: `exp(x)`

### Grekiska bokstäver

Skriv namnet: `alpha`, `beta`, `gamma`, `pi`, osv.

### Specialsymboler

- **Oändlighet**: `infinity` → ∞
- **Pilar**: `->` → →, `<->` → ↔
- **Olikheter**: `<=` → ≤, `>=` → ≥, `!=` → ≠
- **Plus/Minus**: `+/-` → ±

### Avancerat

- **Gränsvärden**: `lim_{x -> infinity} f(x)`
- **Summor**: `sum_{i=1}^{n} i`
- **Integraler**: `integral_{0}^{1} f(x) dx`

## Användning

1. Öppna `index.html` i en webbläsare
2. Skriv din ekvation i textområdet
3. Ekvationen renderas automatiskt, eller klicka "Rendera ekvation"
4. Klicka "Ladda ner som PNG" eller "Ladda ner som JPG" för att spara bilden

## Exempel

Prova dessa exempelekvationer:

- `x^2 + 2*x + 1 = 0` (Andragradsekvation)
- `f(x) = sqrt(x^2 + 1)` (Kvadratrotsfunktion)
- `lim_{x -> infinity} (1 + 1/x)^x = e` (Gränsvärde)
- `sum_{i=1}^{n} i = n(n+1)/2` (Summaformel)
- `integral_{0}^{1} x^2 dx = 1/3` (Integral)
- `A = pi * r^2` (Cirkelarea)

## Tekniska detaljer

- Använder MathJax för matematisk rendering
- Konverterar användarvänlig syntax till LaTeX internt
- Genererar högkvalitativa SVG som konverteras till rasterbilder
- Ingen server behövs - körs helt i webbläsaren

### Intern översikt: rendering och nedladdning

1. Användarinmatning skrivs i ett vanligt textområde i en “snabb-syntax” (t.ex. `sqrt(x)/(x+1)`), inte ren LaTeX.
2. Funktionen `convertToLatex()` i `script.js` kör en uppsättning regex-omvandlingar som ersätter:
 - Grekiska bokstäver (alpha → `\alpha`), funktioner (sin → `\sin`), operatorer (`->` → `\to`, etc.)
 - Bråk (`a/b`, `(x+1)/(x-1)` → `\frac{...}{...}`), rötter (`sqrt(x)` → `\sqrt{x}`), potenser / index (`x^2`, `x_1`).
3. Det inslagna LaTeX-uttrycket matas in i en MathJax display-sträng: `$$…$$` och MathJax v3 (SVG-output) renderar direkt inuti `#mathPreview`.
4. MathJax-konfiguration använder `svg: { fontCache: 'none' }` vilket gör att varje enskilt uttrycks `<svg>` innehåller egna `<defs>` med glyph-paths (viktigt för fristående export utan global cache).
5. Vid nedladdning (PNG/JPG):
 - `downloadImage()` hittar MathJax `<svg>`-elementet.
 - `buildStandaloneSVG()` klonar och serialiserar SVG:n, beräknar en tight bounding box via `getBBox()`, och packar in innehållet i en ny `<svg>` med vit bakgrund och padding.
 - Om `<defs>` saknas (oväntat när `fontCache: none` är aktiv) försöker koden kopiera glyph-definitioner från ett globalt cache-`<svg>`.
 - Den fristående SVG-strängen görs till en Blob–URL (och vid fel även en base64 data-URL fallback) och laddas i ett osynligt `Image()`-objekt.
 - När bilden har laddats ritas den på en offscreen `<canvas>` i 2× upplösning (skarp rasterisering) och exporteras via `canvas.toBlob()` som PNG eller JPG.
6. Vid SVG-nedladdning (denna knapp togs bort i nuvarande UI) skulle samma fristående SVG-sträng sparas direkt.
7. Felhantering: Om rasteriseringen misslyckas faller koden tillbaka till en förenklad text-bild (fallback) – detta ska normalt inte aktiveras nu.

### Nyckelfiler

- `index.html` – Struktur, knappar, kopplad MathJax-script, temaklasser.
- `styles.css` – “Pen & paper” tema: svart/vitt, rutnäts-/linje-liknande bakgrund, handritad känsla via skuggor och kraftiga ramar.
- `script.js` – All logik: input→LaTeX, MathJax render, SVG→Canvas export.

### Viktiga funktioner i `script.js`

- `convertToLatex(input)` – Parser/transform.
- `renderMath()` – Triggar MathJax, togglar knappstatus och laddnings-indikator.
- `downloadImage(format)` – Huvudingång för export.
- `buildStandaloneSVG(svgElement, padding)` – Producerar komplett fristående SVG.
- `rasterizeStandaloneSVG(svgString, format)` – Skapar canvas och genererar PNG/JPG.

### Anpassning / Fortsatt utveckling

- Lägg till fler makron: Utöka `macros` i MathJax-konfig överst i `script.js`.
- Extra operatorer: Utöka regex i `convertToLatex`.
- Transparent bakgrund: Ta bort `<rect fill="white"/>` i `buildStandaloneSVG` och ändra canvas bakgrund.
- Högre DPI: Öka `scale`-variabeln i `rasterizeStandaloneSVG` (t.ex. 3 eller 4) för större utskriftskvalitet.
- Återinföra SVG-nedladdning: Lägg till knapp och kalla `createCompleteSVG()` eller `buildStandaloneSVG()` direkt och spara Blob.

### Kända begränsningar

- Parsern är regelbaserad och täcker vanliga mönster; mycket komplex LaTeX (matriser, cases, align) kräver manuell LaTeX eller parserutökning.
- Ingen automatisk utrymmesinsättning (implicit multiplikation) bortom enkla mönster.
- Flera uttryck i rad (t.ex. `x^2; y^2`) hanteras inte separat – använd ett uttryck åt gången.

### Tips för vidare arbete

- Inför en liten testsvit (t.ex. JSON-lista med input→expected LaTeX) och kör i webbläsarkonsolen för regressionsskydd.
- Cachea senaste exporterade SVG för snabb upprepad nedladdning när bara formatet ändras.
- Lägg till mörkt läge genom att växla CSS-variabler och invertera bakgrund.

## Webbläsarstöd

Fungerar i alla moderna webbläsare som stöder:

- HTML5 Canvas
- SVG
- ES6 JavaScript

## Installation

1. Klona eller ladda ner filerna
2. Öppna `index.html` i en webbläsare
3. Ingen serverinstallation behövs!

Njut av att skapa vackra matematiska bilder! 🧮✨
