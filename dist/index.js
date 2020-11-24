"use strict";
/**
 * @package fut-search
 * @author Ben Hawley
 * @file Contains class for streaming and searching FUT CSV data
 * @copyright Ben Hawley 2020
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FUTSearch = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const parse_1 = require("@fast-csv/parse");
/**
 * Class to search FUT CSV data for Players
 * @class
 */
class FUTSearch {
    /**
     * Create an instance of FUT
     * @param dataPath set where the CSV is located
     */
    constructor(dataPath) {
        /**
         * Path to the CSV Data
         * By default, we look three directories up -
         * as this will take us to the project root from project/node_modules/@benhawley7/fut-search
         * @private
         */
        this._dataPath = path.join(__dirname, "../../../", "data", "FIFA20.csv");
        if (dataPath) {
            this.dataPath = dataPath;
        }
    }
    /**
     * Returns the path to the current CSV we are accessing
     */
    get dataPath() {
        return this._dataPath;
    }
    /**
     * Sets the path to the CSV we wish to query, errors if file does not exist
     * @param val where to look for our FUT CSV data
     */
    set dataPath(val) {
        const isCSV = val.endsWith(".csv");
        if (isCSV === false) {
            throw new Error("dataPath must point to a CSV file");
        }
        this._dataPath = val;
    }
    /**
     * Parse a CSV record as a Player
     * @param record the csv row
     * @returns parsed Player
     */
    static parsePlayer(record) {
        const formattedRecord = {};
        for (const [key, value] of Object.entries(record)) {
            formattedRecord[key.toLowerCase()] = value;
        }
        return {
            name: String(formattedRecord.name),
            club: String(formattedRecord.club),
            position: String(formattedRecord.position),
            revision: String(formattedRecord.revision),
            league: String(formattedRecord.league),
            rating: parseInt(formattedRecord.rating, 10),
            pace: parseInt(formattedRecord.pace, 10),
            shooting: parseInt(formattedRecord.shooting, 10),
            passing: parseInt(formattedRecord.passing, 10),
            dribbling: parseInt(formattedRecord.dribbling, 10),
            defending: parseInt(formattedRecord.defending, 10),
            physicality: parseInt(formattedRecord.physicality, 10)
        };
    }
    /**
     * Compare an incomplete player record to a complete player
     * @param partial an incomplete player
     * @param player a complete player
     * @returns are they are a potential match?
     */
    static playerMatch(partial, player) {
        for (const [key, value] of Object.entries(partial)) {
            // For numbers, we simply check the values match
            if (typeof value === "number") {
                if (partial[key] !== player[key]) {
                    return false;
                }
            }
            else {
                const partialValueLowerCase = String(partial[key])
                    .toLowerCase()
                    .normalize("NFKD")
                    .replace(/[^\w\s.-_\/]/g, '');
                const playerValueLowerCase = String(player[key])
                    .toLowerCase()
                    .normalize("NFKD")
                    .replace(/[^\w\s.-_\/]/g, '');
                if (playerValueLowerCase.includes(partialValueLowerCase) === false) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Finding matching players for a batch of partial players
     * @param partialPlayers array of partials to find
     * @param options flags for search
     * @param options.firstMatchOnly if true we return only the first match for each partial
     * @returns array of matching players for each partial supplied
     */
    listPlayersBatch(partialPlayers, options = { firstMatchOnly: false }) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res, rej) => {
                // We store an array of each partial containing its player matches
                const matchingPlayers = partialPlayers.map(() => []);
                // To find a the matching player, we need to read the CSV. These CSVs have about 15,000
                // rows, so loading the entire CSV into memory doesn't seem sensible.
                // Instead, we can read the CSV as a stream and check each row as it comes in
                const csvReadStream = fs.createReadStream(this.dataPath)
                    .on("error", (error) => {
                    rej(error);
                });
                // The parse and match CSV Parser Stream will have the CSV stream piped into it, for each row of data
                // it will parse the data into our Player interface and will check if it is a match on our
                // input name and club. Upon completion, it will resolve the matching player, or reject with an error.
                const parseAndMatch = parse_1.parse({ headers: true })
                    .on('error', error => rej(new Error(`Error parsing CSV: ${error.message}`)))
                    .on('data', row => {
                    // With the first match only flag, we resolve early if we have one match for every player
                    const canEarlyResolve = options.firstMatchOnly && matchingPlayers.every(playerMatch => playerMatch.length > 0);
                    if (canEarlyResolve) {
                        // Resolve the early matches
                        res(matchingPlayers);
                        // Destroy the streams
                        csvReadStream.destroy();
                        parseAndMatch.destroy();
                        return;
                    }
                    // Parse the current row as a complete player
                    const player = FUTSearch.parsePlayer(row);
                    for (const [index, partial] of partialPlayers.entries()) {
                        const isMatch = FUTSearch.playerMatch(partial, player);
                        const partialComplete = options.firstMatchOnly && matchingPlayers[index].length > 0;
                        if (isMatch === true && partialComplete === false) {
                            matchingPlayers[index].push(player);
                        }
                    }
                })
                    .on('end', () => {
                    res(matchingPlayers);
                });
                // Pipe the CSV into the parseAndMatch CSV Parser Stream
                csvReadStream.pipe(parseAndMatch);
            });
        });
    }
    /**
     * Finding matching players for a supplied partial player
     * @param playerDetails partial player stats
     * @returns array of matching players
     */
    listPlayers(playerDetails = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const [players] = yield this.listPlayersBatch([playerDetails]);
            return players;
        });
    }
    /**
     * Find a player with the supplied stats
     * @param playerDetails partial player stats
     * @returns player
     */
    findPlayer(playerDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            const [[player]] = yield this.listPlayersBatch([playerDetails], { firstMatchOnly: true });
            return player;
        });
    }
}
exports.FUTSearch = FUTSearch;
//# sourceMappingURL=index.js.map