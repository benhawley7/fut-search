import * as fs from "fs";
import * as path from "path";
import { parse } from "@fast-csv/parse";

/**
 * Interface for the arguments of the FUTSearch class
 * @interface
 */
interface ConstructorOptions {
    gameYear: string;
    dataDir: string;
}

/**
 * Interface for a fully parsed FIFA player
 * @interface
 */
interface Player {
    [key: string]: string | number;
    name: string;
    club: string;
    position: string;
    tier: string;
    league: string;
    rating: number;
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
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
    tier?: string;
    league?: string;
    rating?: number;
    pace?: number;
    shooting?: number;
    passing?: number;
    dribbling?: number;
    defending?: number;
    physical?: number;
}

/**
 * Class to search FUT CSV data for Players
 * @class
 */
export class FUTSearch {

    /**
     * Path to the CSV Data
     * @private
     */
    private dataDir: string = path.join(__dirname, "../../", "data");

    /**
     * Year of the FIFA Data to query
     * @public
     */
    public gameYear: string = "20";

    /**
     * Create an instance of FUT
     * @param options specify the game year and path to use
     * @param options.gameYear year of the FIFA game to query
     * @param options.dataDir directory storing the FIFA data CSVs
     */
    constructor(options: ConstructorOptions) {
        if (options.gameYear) {
            this.gameYear = options.gameYear;
        }
        if (options.dataDir) {
            this.dataDir = options.dataDir;
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
            tier: String(formattedRecord.tier),
            league: String(formattedRecord.league),
            rating: parseInt(formattedRecord.rating, 10),
            pace: parseInt(formattedRecord.pace, 10),
            shooting: parseInt(formattedRecord.shooting, 10),
            passing: parseInt(formattedRecord.passing, 10),
            dribbling: parseInt(formattedRecord.dribbling, 10),
            defending: parseInt(formattedRecord.defending, 10),
            physical: parseInt(formattedRecord.physical, 10)
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
                const partialValueLowerCase = String(partial[key]).toLowerCase();
                const playerValueLowerCase = String(player[key]).toLowerCase();
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
            const csvReadStream = fs.createReadStream(path.join(this.dataDir, `FIFA${this.gameYear}.csv`))
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
                .on('end', (rowCount: number) => {
                    if (matchingPlayers.length === 0) {
                        rej(new Error(`Could not find FIFA${this.gameYear} players for partial player: ${JSON.stringify(playerDetails)}`));
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
