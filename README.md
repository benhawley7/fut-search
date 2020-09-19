# fut-search
Module for searching players in FIFA Ultimate Team CSV Data.

## Installing
Via npm:
```
npm i fut-search
```

## Data
You will need a local set of FUT CSV data to point the module towards.

A good source of this data can be found here: https://github.com/kafagy/fifa-FUT-Data


The CSV needs the following format:
| name            | club              | league                 | position | tier | rating | pace | shooting | passing | dribbling | defending | physical |
|-----------------|-------------------|------------------------|----------|------|--------|------|----------|---------|-----------|-----------|----------|
| Anthony Martial | Manchester United | England Premier League | LW       | Gold | 85     | 86   | 75       | 83      | 78        | 80        | 74       |

note: Additional headers or uppercase headers should not cause errors.

The game CSVs need to be in an accessible folder with the follwoing naming convention: `FIFA{year}.csv` i.e. `FIFA20.csv` or `FIFA19.csv`.

By default, the module will look for the CSVs in `/data`

## Example

```js
const {FUTSearch} = require("fut-search");
const path = require("path");

const fut = new FUTSearch({
    gameYear: "20", // Which FIFA game year?
    dataDir: path.join(__dirname, "data") // Where is your CSV data stored?
})

// Find a player with given attributes
fut.findPlayer({
    name: "Rashford",
    club: "Manchester United"
}).then(player => {
    // {
    //     name: 'Marcus Rashford',
    //     club: 'Manchester United',
    //     position: 'ST',
    //     tier: 'Gold',
    //     rating: 83,
    //     pace: 81,
    //     shooting: 75,
    //     passing: 81,
    //     dribbling: 87,
    //     defending: 60,
    //     physical: 66
    // }
})

// List Players with shared attributes
fut.listPlayers({
    position: "ST",
    rating: 89,
    league: "Premier League"
}).then(players => {
    // [
    //     {
    //       name: 'Pierre-Emerick Aubame...',
    //       club: 'Arsenal',
    //       position: 'ST',
    //       tier: 'Gold',
    //       league: 'England Premier League',
    //       rating: 89,
    //       pace: 42,
    //       shooting: 62,
    //       passing: 80,
    //       dribbling: 81,
    //       defending: 85,
    //       physical: 80
    //     },
    //     {
    //       name: 'Sergio Agüero',
    //       club: 'Manchester City',
    //       position: 'ST',
    //       tier: 'Gold',
    //       league: 'England Premier League',
    //       rating: 89,
    //       pace: 72,
    //       shooting: 68,
    //       passing: 75,
    //       dribbling: 74,
    //       defending: 87,
    //       physical: 85
    //     },
    //     ...
    // ]
});
```