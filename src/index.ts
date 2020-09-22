/**
 * @package fut-search
 * @author Ben Hawley
 * @file Contains class for streaming and searching FUT CSV data
 * @copyright Ben Hawley 2020
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "@fast-csv/parse";

/**
 * Interface for a fully parsed FIFA player
 * @interface
 */
interface Player {
    [key: string]: string | number;
    name: string;
    club: string;
    position: string;
    revision: string;
    league: string;
    rating: number;
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physicality: number;
}

/**
 * Interface for a player with partial stats
 * @interface
 */
interface PartialPlayer {
    [key: string]: string | number | undefined;
    name?: string;
    club?: string;
    position?: string;
    revision?: string;
    league?: string;
    rating?: number;
    pace?: number;
    shooting?: number;
    passing?: number;
    dribbling?: number;
    defending?: number;
    physicality?: number;
}

/**
 * Interface for listPlayersBatch flags
 * @interface
 */
interface ListPlayersBatchOptions {
    firstMatchOnly?: boolean;
}

/**
 * Class to search FUT CSV data for Players
 * @class
 */
export class FUTSearch {

    /**
     * Path to the CSV Data
     * By default, we look three directories up -
     * as this will take us to the project root from project/node_modules/@benhawley7/fut-search
     * @private
     */
    private _dataPath: string = path.join(__dirname, "../../../", "data", "FIFA20.csv");

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
    set dataPath(val: string) {
        const isCSV = val.endsWith(".csv");
        if (isCSV === false) {
            throw new Error("dataPath must point to a CSV file");
        }
        this._dataPath = val;
    }

    /**
     * Create an instance of FUT
     * @param dataPath set where the CSV is located
     */
    constructor(dataPath?: string) {
        if (dataPath) {
            this.dataPath = dataPath;
        }
    }

    /**
     * Parse a CSV record as a Player
     * @param record the csv row
     * @returns parsed Player
     */
    static parsePlayer(record: any): Player {
        const formattedRecord: any = {};
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
    static playerMatch(partial: PartialPlayer, player: Player): boolean {
        for (const [key, value] of Object.entries(partial)) {
            // For numbers, we simply check the values match
            if (typeof value === "number") {
                if (partial[key] !== player[key]) {
                    return false;
                }
            } else {
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
    async listPlayersBatch(partialPlayers: PartialPlayer[], options: ListPlayersBatchOptions = {}): Promise<Player[][]> {
        return new Promise((res, rej) => {
            // We store an array of each partial containing its player matches
            const matchingPlayers: Player[][] = partialPlayers.map(() => []);

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
            const parseAndMatch = parse({ headers: true })
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
    }

    /**
     * Finding matching players for a supplied partial player
     * @param playerDetails partial player stats
     * @returns array of matching players
     */
    async listPlayers(playerDetails: PartialPlayer = {}): Promise<Player[]> {
        const [players] = await this.listPlayersBatch([playerDetails]);
        return players;
    }

    /**
     * Find a player with the supplied stats
     * @param playerDetails partial player stats
     * @returns player
     */
    async findPlayer(playerDetails: PartialPlayer): Promise<Player|undefined> {
        const [[player]] = await this.listPlayersBatch([playerDetails], {firstMatchOnly: true});
        return player;
    }
}
