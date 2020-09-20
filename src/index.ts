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
     * Read players from CSV and find matches to a supplied partial player
     * @param playerDetails partial player stats
     * @returns array of matching players
     */
    listPlayers(playerDetails: PartialPlayer = {}): Promise<Player[]> {
        return new Promise((res, rej) => {
            // Store any matching players from the CSV here
            const matchingPlayers: Player[] = [];

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
                .on('error', error => rej(new Error(`Error finding player: ${error.message}`)))
                .on('data', row => {
                    const player = FUTSearch.parsePlayer(row);
                    if (FUTSearch.playerMatch(playerDetails, player)) {
                        matchingPlayers.push(player);
                    }
                })
                .on('end', () => {
                    if (matchingPlayers.length === 0) {
                        rej(new Error(`Could not find matching players for partial player: ${JSON.stringify(playerDetails)}`));
                    }
                    res(matchingPlayers);
                });

            // Pipe the CSV into the parseAndMatch CSV Parser Stream
            csvReadStream.pipe(parseAndMatch);
        });
    }

    /**
     * Find a player with the supplied stats
     * @param playerDetails partial player stats
     * @returns player
     */
    async findPlayer(playerDetails: PartialPlayer): Promise<Player> {
        const players = await this.listPlayers(playerDetails);

        // Naive approach of taking the first player.
        // Need to think of a better approach.
        return players[0];
    }
}
