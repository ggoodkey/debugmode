function changeDebugMode(e) {
    if (e)
        e.stopPropagation();
    if (DEBUG_MODE === true) {
        debug("Debug Mode turned off");
        setDebugMode(false);
    }
    else {
        setDebugMode(true);
        debug("Debug Mode turned on");
    }
}
function moveDebugWindow() { 
    layout();
    DEBUG_DIV.className = /debugRight/.test(DEBUG_DIV.className) ? "" : "debugRight";
}
function timeStamp(d) {
    var m = d.getMinutes(), s = d.getSeconds(), x = d.getMilliseconds(), m1, s1, x1;
    DEBUG_COUNT++;
    DEBUG_TIME = d.getTime();
    /* add a zero in front of numbers<10 */
    m1 = m < 10 ? "0" + m : m.toString();
    s1 = s < 10 ? "0" + s : s.toString();
    x1 = x < 10 ? "0" + x : x.toString();
    x1 = x < 100 ? "0" + x1 : x1;
    return m1 + ":" + s1 + ":" + x1;
}
function _debug(timestamp, code, description, severity) {
    function span(clas, contents, title) {
        var str = '<span class="debug-';
        str += clas;
        str += '"';
        if (title) {
            str += ' title="';
            str += title;
            str += '"';
        }
        str += '>';
        str += contents.toString();
        str += '</span>';
        return str;
    }
    function print_Val(val, ancestors = []) {
        var str = "";
        if (val instanceof Function)
            str = span('function', 'function() {...}');
        else if (typeof val === "number" && val > 16e11 && val < 2e12) {
            //a number in this range could be a date
            str = span('number', val, new Date(val).toString());
        }
        else if (typeof val === 'bigint')
            str = span(typeof val, val.toString() + 'n');
        else if (val === null)
            str = span("error", "null");
        else if (typeof val === "undefined")
            str = span("error", "undefined");
        else if (typeof val === "string") {
            if (val === "")
                str = span("error", 'Empty string: ("")');
            else if (val === " ")
                str = span("error", 'A space: (" ")');
            else {
                //disarm character codes and html tags
                val = val.replace(/[\u00A0-\u9999<>\&]/gim, function (i) { return '&#' + i.charCodeAt(0) + ';'; });
                val = val.replace(/\r\n|\r|\n/g, span('text', 'NL') + '<br />');
                str = span("string", val);
            }
            if (str.length > 5007)
                str = str.slice(0, 5000) + "</span>" + span("text", "...etc. etc. " + str.length / 5000 + " times");
        }
        else if (typeof val === "object") {
            if (val instanceof Date)
                str = span("date", val);
            else if (val instanceof Array)
                str = print_Array(val, ancestors);
            else if (val instanceof Error)
                str = span("error", val.name + ": " + val.message, val.stack);
            else if (val instanceof RegExp)
                str = span("regexp", val.toString());
            else if (val instanceof Symbol)
                str = span("symbol", val.toString());
            else
                str = span("object", "{ " + print_Obj(val, ancestors) + " }");
        }
        else
            str = span(typeof val, val);
        val = null;
        return str;
    }
    function print_Array(arr, ancestors = []) {
        var values = [], len = arr.length;
        if (len === 0)
            return span("array", '[ ' + span("error", "Empty array") + ' ]');
        for (var i = 0; i < len; i++)
            values[i] = print_Val(arr[i], ancestors);
        var str = span("array", '[ ' + values.join(", ") + ' ]');
        values = null;
        arr = null;
        return str;
    }
    function to_Readable_JSON(str) {
        function enter() {
            out += "<br />";
            for (a = 0; a < tabDepth; a++) {
                out += "&nbsp;&nbsp;&nbsp;";
            }
        }
        function getArrayDepth(position) {
            //look ahead from 'position' to see how deep the array is
            //if 2d or 3d array, add extra whitespace
            position++;
            for (let depth = 1, len = str.length; position < len; position++) {
                if (str[position] === "[") {
                    depth++;
                    if (depth > arrayDepth)
                        arrayDepth = depth;
                }
                if (str[position] === "]") {
                    depth--;
                    if (depth === 0) {
                        //end of array
                        if (arrayDepth > 0) {
                            arrayEnd = position; //set the end of the array position
                            tabDepth++;
                            enter();
                        }
                        return arrayDepth;
                    }
                }
            }
            return 0;
        }
        var quote = false, tabDepth = 0, prevChar, out = "", a = 0, array = 0, arrayDepth = 0, arrayEnd = 0;
        for (let c = 0, len = str.length; c < len; c++) {
            if ((str[c] === "}" || str[c] === "]" && c === arrayEnd) && !quote) {
                tabDepth--;
                enter();
            }
            out += str[c];
            if (str[c] === '"' && prevChar !== "\\")
                quote = !quote;
            else if (!quote) {
                if (str[c] === "," && (array === 0 || array < arrayDepth)) {
                    enter();
                    if (str[c + 1] === " ")
                        c++; //skip space
                }
                else if (str[c] === "[") {
                    if (c > arrayEnd)
                        getArrayDepth(c);
                    array++;
                }
                else if (str[c] === "]") {
                    array--;
                    if (array === 0)
                        arrayDepth = 0;
                }
                else if (str[c] === "{") {
                    tabDepth++;
                    enter();
                    if (str[c + 1] === " ")
                        c++; //skip space
                }
            }
            prevChar = str[c];
        }
        return out;
    }
    function print_Obj(obj, ancestors = []) {
        var pairs = [], a = 0, val;
        if (ancestors.indexOf(obj) !== -1)
            return span("error", "Circular reference");
        ancestors.push(obj);
        for (let key in obj) {
            val = obj[key];
            if (typeof Object.getOwnPropertyDescriptor(obj, key)?.get === "function" ||
                typeof Object.getOwnPropertyDescriptor(obj, key)?.set === "function") {
                pairs[a] = key + " (getter/setter): " + span("function", print_Val(val, ancestors));
            }
            else
                pairs[a] = key + ': ' + print_Val(val, ancestors);
            a++;
            if (a > 25) {
                pairs[a] = "continued....";
                break;
            }
        }
        a = null;
        obj = null;
        val = null;
        ancestors.pop();
        return pairs.join(",");
    }
    function toDebugDiv() {
        if (!/debugmodeOn/.test(HTML_TAG.className))
            HTML_TAG.className = HTML_TAG.className + " debugmodeOn";
        var debugmessage = `<span class='debug-timestamp'>${timestamp}</span><br />&nbsp;&nbsp;`;
        if (description) {
            if (severity || /error/i.test(description))
                debugmessage += span("error", description + " " + code);
            else
                debugmessage += `${description} ${code}`;
        }
        else
            debugmessage += code;
        debugmessage += "<br />";
        debugmessage += DEBUG_MESSAGE_DIV.innerHTML;
        DEBUG_MESSAGE_DIV.innerHTML = debugmessage;
        debugmessage = null;
    }
    function toConsole(code) {
        if (description)
            console.log(timestamp, description, code);
        else
            console.log(timestamp, code);
    }
    if (DEBUG_TO_CONSOLE === true && (severity || description && /error/i.test(description))) {
        setDebugMode(true);
    }
    if (DEBUG_TO_CONSOLE === true && console)
        toConsole(code);
    if (DEBUG_MODE === true) {
        if (code instanceof Array)
            code = to_Readable_JSON(print_Array(code));
        else if (code instanceof Function)
            code = span('function', 'function() {...}');
        else if (code instanceof Date)
            code = span('date', code);
        else if (code === null || code === undefined)
            code = print_Val(code);
        else if (code instanceof Error)
            code = span("error", code.name + ": " + code.message, code.stack);
        else if (typeof code === "object")
            code = span('object', "{ " + to_Readable_JSON(print_Obj(code)) + " }");
        else
            code = print_Val(code);
        toDebugDiv();
    }
    code = null;
    description = null;
}
function trim(str) {
    str = String(str);
    while (/\s\s/g.test(str))
        str = str.replace(/\s\s/g, " ");
    if (str === " ")
        return "";
    return str.replace(/^\s+|\s+$/gm, "");
}
function layout() {
    var width = window.innerWidth !== null ? window.innerWidth :
        document.body !== null && document.body.clientWidth !== null ? document.body.clientWidth :
            window.screen !== null ? window.screen.availWidth : 0, type = "debugShowLarge ";
    if (width <= 640)
        type = "debugShowSmall ";
    HTML_TAG.className = trim(type + HTML_TAG.className.replace(/debugShowLarge|debugShowSmall/g, ""));
}
function init() {
    var stylesheet = document.createElement('style');
    DEBUG_BUTTONS = document.createElement('div');
    DEBUG_BUTTONS.id = "debugButtons";
    CLEAR_DEBUG_BUTTON = document.createElement('button');
    CLEAR_DEBUG_BUTTON.id = "clearDebug";
    CLEAR_DEBUG_BUTTON.type = "button";
    CLEAR_DEBUG_BUTTON.title = "Clear and Hide Debug Window";
    CLEAR_DEBUG_BUTTON.appendChild(document.createTextNode("_"));
    EXPAND_DEBUG_BUTTON = document.createElement('button');
    EXPAND_DEBUG_BUTTON.id = "expandDebug";
    EXPAND_DEBUG_BUTTON.type = "button";
    EXPAND_DEBUG_BUTTON.title = "Toggle Fullscreen";
    EXPAND_DEBUG_BUTTON.appendChild(document.createTextNode("\u25FB")); //square symbol
    HIDE_DEBUG_BUTTON = document.createElement('button');
    HIDE_DEBUG_BUTTON.id = "hideDebug";
    HIDE_DEBUG_BUTTON.type = "button";
    HIDE_DEBUG_BUTTON.title = "Close Debug Window";
    HIDE_DEBUG_BUTTON.appendChild(document.createTextNode("\u2A2F")); //times symbol
    DEBUG_MESSAGE_DIV = document.createElement('div');
    DEBUG_MESSAGE_DIV.id = "debugMsg";
    DEBUG_DIV = document.createElement('div');
    DEBUG_DIV.id = "debug";
    DEBUG_BUTTONS.appendChild(CLEAR_DEBUG_BUTTON);
    DEBUG_BUTTONS.appendChild(EXPAND_DEBUG_BUTTON);
    DEBUG_BUTTONS.appendChild(HIDE_DEBUG_BUTTON);
    DEBUG_DIV.appendChild(DEBUG_BUTTONS);
    DEBUG_DIV.appendChild(DEBUG_MESSAGE_DIV);
    layout();
    stylesheet.type = 'text/css';
    // eslint-disable-next-line
    stylesheet.innerText = `

	/* Style for debug panel */
	#debug {
		display: none;
	}

	#debugButtons {
		position: absolute;
		top: 0;
		right: 16px;
		z-index: 1;
	}

	#hideDebug,
	#expandDebug, 
	#clearDebug {
		cursor: pointer;
		background-color: transparent;
		border: 1px solid transparent;
		display: inline-block;
		vertical-align: middle;
		font-size: 1em;
		font-weight: bold;
		font-family: Arial, sans-serif;
		padding: 8px;
	}

	#hideDebug {
		font-size: 1.3em;
	}

	#expandDebug {
		font-size: 1.1em;
	}

	html.debugmodeOn #debug {
		color: #eee;
		background-color: #111;
		background-color: rgba(0,0,0,0.7);
		text-shadow: 0 0 2px #000;
		font-family: Consolas, 'Courier New', Courier, monospace;
		position: fixed;
		top: 0;
		left: 0;
		right: auto;
		right: initial;
		width: auto;
		min-width: 25%;
		max-width: 40%;
		height: 100%;
		visibility: visible;
		display: block;
		z-index: 1099;
	}

	html.debugmodeOn #debugMsg {
		height: 100%;
		width: 100%;
		-ms-word-wrap: break-word;
		word-wrap: break-word;
		overflow: auto;
		-webkit-user-select: text;
		-moz-user-select: text;
		-ms-user-select: text;
		user-select: text;
	}

	html.debugmodeOn #debug.debugRight {
		left: auto;
		left: initial;
		right: 0;
	}

	html.debugShowSmall #debug {
		position: fixed;
		width: 100%;
		max-width: 100%;
		height: 45%;
		top: auto;
		top: initial;
		bottom: 0;
	}

	html.debugShowSmall #debug.debugRight {
		top: 0;
		bottom: auto;
		bottom: initial;
	}

	html.debugmodeOn.debugExpanded #debug {
		width: 100%;
		max-width: 100%;
		height: 100%;
	}

	.debug-object {
		color: white;
	}

	.debug-function {
		color: magenta;
	}

	.debug-error {
		color: red;
	}

	.debug-string {
		color: lightblue;
	}

	.debug-boolean {
		color: lightgreen;
	}

	.debug-date {
		color: pink;
	}

	.debug-number {
		color: yellow;
	}

	.debug-text {
		color: lightgray;
	}

	.debug-array {
		color: orange;
	}

	.debug-bigint {
		color: limegreen;
	}

	.debug-symbol {
		color: hotpink;
	}

	.debug-regexp {
		color: cyan;
	}

	.debug-timestamp {
		color: #CCC;
		font-size: 0.75em;
	}`;
    document.head.appendChild(stylesheet);
    window.document.body.insertBefore(DEBUG_DIV, window.document.body.firstChild);
    HIDE_DEBUG_BUTTON.addEventListener('click', changeDebugMode);
    EXPAND_DEBUG_BUTTON.addEventListener('click', expandDebugWindow);
    CLEAR_DEBUG_BUTTON.addEventListener('click', clearDebug);
    DEBUG_DIV.addEventListener('click', moveDebugWindow);
    INITIATED = true;
}
function expandDebugWindow(e) {
    if (e)
        e.stopPropagation();
    if (!HTML_TAG)
        return;
    if (/debugExpanded/.test(HTML_TAG.className))
        HTML_TAG.className = trim(HTML_TAG.className.replace(/debugExpanded/g, ""));
    else
        HTML_TAG.className = trim("debugExpanded " + HTML_TAG.className);
}
function clearDebug(e) {
    if (e)
        e.stopPropagation();
    DEBUG_MESSAGE_DIV.innerHTML = "";
    if (HTML_TAG)
        HTML_TAG.className = trim(HTML_TAG.className.replace(/debugmodeOn/g, ""));
}
function destroy() {
    if (HIDE_DEBUG_BUTTON)
        HIDE_DEBUG_BUTTON.removeEventListener('click', changeDebugMode);
    if (EXPAND_DEBUG_BUTTON)
        EXPAND_DEBUG_BUTTON.removeEventListener('click', expandDebugWindow);
    if (CLEAR_DEBUG_BUTTON)
        CLEAR_DEBUG_BUTTON.removeEventListener('click', clearDebug);
    if (DEBUG_DIV) {
        DEBUG_DIV.removeEventListener('click', moveDebugWindow);
        window.document.body.removeChild(DEBUG_DIV);
    }
    if (HTML_TAG)
        HTML_TAG.className = trim(HTML_TAG.className.replace(/debugmodeOn|debugShowLarge|debugShowSmall/g, ""));
}
var DEBUG_COUNT = 0, DEBUG_TIME = new Date().getTime(), DEBUG_STOP = false, DEBUG_MODE = false, DEBUG_TO_CONSOLE = false, ERROR_CACHE = [], CACHE_MSG_INDEX = 0, INITIATED = false, DEBUG_BUTTONS, HIDE_DEBUG_BUTTON, EXPAND_DEBUG_BUTTON, CLEAR_DEBUG_BUTTON, DEBUG_DIV, DEBUG_MESSAGE_DIV, HTML_TAG = document.getElementsByTagName("html")[0];
/** toggles debugmode on or off
 * @param { boolean } debugMode true = on, false = off
 * @returns { boolean } the set value of DEBUG_MODE
 */
export function setDebugMode(debugMode) {
    if (debugMode === true) {
        if (!INITIATED)
            init();
        DEBUG_MODE = debugMode;
        while (CACHE_MSG_INDEX-- > 0) {
            _debug.apply(null, ERROR_CACHE[CACHE_MSG_INDEX]);
        }
        ERROR_CACHE = [];
    }
    else if (debugMode === false) {
        destroy();
        INITIATED = false;
        DEBUG_MODE = debugMode;
    }
    else {
        DEBUG_MODE = true;
        debug(debugMode, "Error: Cannot set DebugMode to", true);
    }
    return DEBUG_MODE;
}
/** toggles debugging to the console on or off
 * @param { boolean } debugMode true = on, false = off
 * @returns { boolean } the set value of DEBUG_TO_CONSOLE
 */
export function setDebugToConsole(debugMode) {
    if (debugMode === true) {
        if (!INITIATED)
            init();
        DEBUG_TO_CONSOLE = debugMode;
        while (CACHE_MSG_INDEX-- > 0) {
            _debug.apply(null, ERROR_CACHE[CACHE_MSG_INDEX]);
        }
        ERROR_CACHE = [];
    }
    else if (debugMode === false) {
        DEBUG_TO_CONSOLE = debugMode;
        if (DEBUG_MODE === false) {
            destroy();
            INITIATED = false;
        }
    }
    else {
        DEBUG_TO_CONSOLE = true;
        debug(debugMode, "Error: Cannot set DebugToConsole to", true);
    }
    return DEBUG_TO_CONSOLE;
}
/** cache a debug message to be displayed later, if and when debugmode is turned on
 * @param { any } code the item to inspect, can be of any type
 * @param { string } [description] a name or description of the item being inspected
 * @param { boolean } [severity] whether or not this is an error message
 * @returns { void }
 */
export function cacheMsg(code, description, severity) {
    if (DEBUG_MODE === true)
        debug(code, description, severity);
    else {
        ERROR_CACHE[CACHE_MSG_INDEX] = [timeStamp(new Date()), code, description, severity];
        CACHE_MSG_INDEX++;
    }
}
/** display the contents of a variable, object, number, string, array, function etc., on screen and/or to the console
 * @param { any } code the item to inspect, can be of any type
 * @param { string } [description] a name or description of the item being inspected
 * @param { boolean } [severity] whether or not this is an error message
 * @returns { void }
 */
export function debug(code, description, severity) {
    if (!INITIATED)
        return;
    var d = new Date();
    if (DEBUG_STOP === true && d.getTime() - DEBUG_TIME > 5000) {
        DEBUG_COUNT = 0;
        DEBUG_STOP = false;
    }
    if (DEBUG_STOP === false && DEBUG_COUNT > 250 && d.getTime() < DEBUG_TIME + 1000) {
        var debugmessage = "<br />--TOO MANY MESSAGES LOGGED--<br /><br />";
        debugmessage += DEBUG_MESSAGE_DIV.innerHTML;
        DEBUG_MESSAGE_DIV.innerHTML = debugmessage;
        debugmessage = null;
        DEBUG_STOP = true;
    }
    if (DEBUG_STOP === false) {
        _debug(timeStamp(d), code, description, severity);
    }
    d = null;
}
//# sourceMappingURL=debugmode.js.map