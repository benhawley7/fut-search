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
export declare class FUTSearch {
    /**
     * Path to the CSV Data
     * @private
     */
    private dataDir;
    /**
     * Year of the FIFA Data to query
     * @public
     */
    gameYear: string;
    /**
     * Create an instance of FUT
     * @param options specify the game year and path to use
     * @param options.gameYear year of the FIFA game to query
     * @param options.dataDir directory storing the FIFA data CSVs
     */
    constructor(options: ConstructorOptions);
    /**
     * Parse a CSV record as a Player
     * @param record the csv row
     * @returns parsed Player
     */
    static parsePlayer(record: any): Player;
    /**
     * Compare an incomplete player record to a complete player
     * @param partial an incomplete player
     * @param player a complete player
     * @returns are they are a potential match?
     */
    static playerMatch(partial: PartialPlayer, player: Player): boolean;
    /**
     * Read players from CSV and find matches to a supplied partial player
     * @param playerDetails partial player stats
     * @returns array of matching players
     */
    listPlayers(playerDetails?: PartialPlayer): Promise<Player[]>;
    /**
     * Find a player with the supplied stats
     * @param playerDetails partial player stats
     * @returns player
     */
    findPlayer(playerDetails: PartialPlayer): Promise<Player>;
}
export {};
