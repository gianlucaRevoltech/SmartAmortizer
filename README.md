# SmartAmortizer

Una pagina sola per tenere d'occhio i finanziamenti: quanto resta da pagare, il debito residuo, come cambia la rata nel tempo e il prospetto rata per rata.

Finanziamenti caricati:

- **Alfa Romeo Stelvio** (Rosso Edizione, Grigio Silverstone): Stellantis Financial Services, 26.789,42 € in 96 rate da 378,82 € + 30 € di assicurazione per le prime 48, dal 29 giugno 2025.
- **Kawasaki Z650S** (nero e oro): 36 rate da 210 €, dal 15 febbraio 2027 al 15 gennaio 2030.

## Uso

Apri `index.html` nel browser. Non serve build né server: HTML, CSS e JavaScript sono tutti nel file.

Le rate con scadenza passata risultano pagate in automatico, quindi la pagina è sempre aggiornata alla data di oggi.

## Modificare i dati

I finanziamenti sono nell'array `FINANZIAMENTI` in cima allo script di `index.html`. Per ognuno: capitale (o `null` se il TAN non è noto), rata, numero di rate, eventuale assicurazione e data della prima scadenza.

## Foto

Foto rappresentative da Wikimedia Commons, ritagliate:

- [Stelvio](https://commons.wikimedia.org/wiki/File:Alfa_Romeo_Stelvio_Suv_Free_Car_Picture_-_Give_Credit_Via_Link.jpg) di Motor Verso ([motorverso.com](https://www.motorverso.com)), CC BY 2.0.
- [Z650S](https://commons.wikimedia.org/wiki/File:Kawasaki_Z650S_2026.jpg) di MotorideSA, CC BY-SA 4.0, con lo sfondo attenuato (stessa licenza).
