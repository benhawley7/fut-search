# fut-search
Module for searching players in FIFA Ultimate Team CSV Data.

## Installing
Via npm:
```
npm i @benhawley7/fut-search
```

## Data
You will need a local set of FUT CSV data to point the module towards.


The CSV needs the following format:
| name            | club              | league         | position | revision | rating | pace | shooting | passing | dribbling | defending | physicality |
|-----------------|-------------------|----------------|----------|----------|--------|------|----------|---------|-----------|-----------|-------------|
| Anthony Martial | Manchester United | Premier League | LW       | Normal   | 83     | 89   | 81       | 72      | 87        | 41        | 71          |

note: Additional headers or uppercase headers should not cause errors.

The game CSVs need to be in an accessible folder with the following naming convention: `FIFA{year}.csv` i.e. `FIFA20.csv` or `FIFA19.csv`.

By default, the module will look for the CSVs in `/data`

## Example

```js
const {FUTSearch} = require("@benhawley7/fut-search");
const path = require("path");

const fut = new FUTSearch(
    path.join(__dirname, "my-data", "FIFA20.csv") // Where is your CSV data stored?
)

// Find a player with given attributes
fut.findPlayer({
    name: "Rashford",
    club: "Manchester United",
    revision: "Normal"
}).then(player => {
    // {
    //     name: 'Marcus Rashford',
    //     club: 'Manchester United',
    //     position: 'ST',
    //     revision: 'Normal',
    //     league: 'Premier League',
    //     rating: 83,
    //     pace: 92,
    //     shooting: 82,
    //     passing: 73,
    //     dribbling: 85,
    //     defending: 45,
    //     physicality: 77
    // }
})

// List Players with shared attributes
fut.listPlayers({
    position: "ST",
    rating: 89,
    league: "Premier League",
}).then(players => {
    // [
    //     {
    //         name: 'Sergio Agüero',
    //         club: 'Manchester City',
    //         position: 'ST',
    //         revision: 'Normal',
    //         league: 'Premier League',
    //         rating: 89,
    //         pace: 80,
    //         shooting: 90,
    //         passing: 77,
    //         dribbling: 88,
    //         defending: 33,
    //         physicality: 74
    //     },
    //     {
    //         name: 'Harry Kane',
    //         club: 'Tottenham Hotspur',
    //         position: 'ST',
    //         revision: 'Normal',
    //         league: 'Premier League',
    //         rating: 89,
    //         pace: 70,
    //         shooting: 91,
    //         passing: 79,
    //         dribbling: 80,
    //         defending: 47,
    //         physicality: 83
    //     }
    //     ...
    // ]
});
```

## Known Issues
- Goalkeepers not currently supported