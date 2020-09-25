/**
 * @package fut-search
 * @author Ben Hawley
 * @file Contains class for streaming and searching FUT CSV data
 * @copyright Ben Hawley 2020
 */
/**
 * Interface for a fully parsed FIFA player
 * @interface
 */
export interface Player {
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
export interface PartialPlayer {
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
export declare class FUTSearch {
    /**
     * Path to the CSV Data
     * By default, we look three directories up -
     * as this will take us to the project root from project/node_modules/@benhawley7/fut-search
     * @private
     */
    private _dataPath;
    /**
     * Returns the path to the current CSV we are accessing
     */
    get dataPath(): string;
    /**
     * Sets the path to the CSV we wish to query, errors if file does not exist
     * @param val where to look for our FUT CSV data
     */
    set dataPath(val: string);
    /**
     * Create an instance of FUT
     * @param dataPath set where the CSV is located
     */
    constructor(dataPath?: string);
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
     * Finding matching players for a batch of partial players
     * @param partialPlayers array of partials to find
     * @param options flags for search
     * @param options.firstMatchOnly if true we return only the first match for each partial
     * @returns array of matching players for each partial supplied
     */
    listPlayersBatch(partialPlayers: PartialPlayer[], options?: ListPlayersBatchOptions): Promise<Player[][]>;
    /**
     * Finding matching players for a supplied partial player
     * @param playerDetails partial player stats
     * @returns array of matching players
     */
    listPlayers(playerDetails?: PartialPlayer): Promise<Player[]>;
    /**
     * Find a player with the supplied stats
     * @param playerDetails partial player stats
     * @returns player
     */
    findPlayer(playerDetails: PartialPlayer): Promise<Player | undefined>;
}
export {};
