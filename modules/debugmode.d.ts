/** toggles debugmode on or off
 * @param { boolean } debugMode true = on, false = off
 * @returns { boolean } the set value of DEBUG_MODE
 */
export declare function setDebugMode(debugMode: boolean): boolean;
/** toggles debugging to the console on or off
 * @param { boolean } debugMode true = on, false = off
 * @returns { boolean } the set value of DEBUG_TO_CONSOLE
 */
export declare function setDebugToConsole(debugMode: boolean): boolean;
/** cache a debug message to be displayed later, if and when debugmode is turned on
 * @param { any } code the item to inspect, can be of any type
 * @param { string } [description] a name or description of the item being inspected
 * @param { boolean } [severity] whether or not this is an error message
 * @returns { void }
 */
export declare function cacheMsg(code: any, description?: string, severity?: boolean): void;
/** display the contents of a variable, object, number, string, array, function etc., on screen and/or to the console
 * @param { any } code the item to inspect, can be of any type
 * @param { string } [description] a name or description of the item being inspected
 * @param { boolean } [severity] whether or not this is an error message
 * @returns { void }
 */
export declare function debug(code: any, description?: string, severity?: boolean): void;
