"use strict";
interface GlobalAppFunctions {
	/** toggles debugmode on or off */
	setDebugMode: (debugMode: boolean) => boolean;

	/** toggles debugging to the console on or off */
	setDebugToConsole: (debugMode: boolean) => boolean;

	/** cache a debug message to be displayed later, if and when debugmode is turned on */
	cacheMsg: (code: any, description?: string, severity?: boolean) => void;

	/** display the contents of a variable, object, number, string, array, function etc., on screen and/or to the console */
	debug: (code: any, description?: string, severity?: boolean) => void;
}
var APP: GlobalAppFunctions = APP! || {};
(function () {
	function changeDebugMode() {
		if (DEBUG_MODE === true) {
			APP.debug("Debug Mode turned off");
			APP.setDebugMode(false);
		}
		else {
			APP.setDebugMode(true);
			APP.debug("Debug Mode turned on");
		}
	}
	function moveDebugWindow() {
		layout();
		DEBUG_DIV.className = /debugRight/.test(DEBUG_DIV.className) ? "" : "debugRight";
	}
	function timeStamp(d: Date) {
		var m = d.getMinutes(), s = d.getSeconds(), x = d.getMilliseconds(), m1: string, s1: string, x1: string;
		DEBUG_COUNT++;
		DEBUG_TIME = d.getTime();
		/* add a zero in front of numbers<10 */
		m1 = m < 10 ? "0" + m : m.toString();
		s1 = s < 10 ? "0" + s : s.toString();
		x1 = x < 10 ? "0" + x : x.toString();
		x1 = x < 100 ? "0" + x1 : x1;
		return m1 + ":" + s1 + ":" + x1;
	}
	function _debug(timestamp: string, code: any, description?: string, severity?: boolean) {
		function span(clas: string, contents: any, title?: string) {
			var str = '<span class="debug-';
			str += clas;
			str += '"';
			if (title) {
				str += ' title="';
				str += title;
				str += '"';
			}
			str += '>';
			str += contents;
			str += '</span>';
			return str;
		}
		function print_Val(val: any) {
			var str = "";
			if (val instanceof Function) str = span('function', 'function() {...}');
			else if (typeof val === "number") {
				if (val > 1500000000000 && val < 2000000000000) str = span('number', val, new Date(val).toString());
				else str = span("number", val);
			}
			else if (val === null) str = span("error", "null");
			else if (typeof val === "undefined") str = span("error", "undefined");
			else if (typeof val === "string") {
				if (val === "") str = span("error", 'Empty string: ("")');
				else if (val === " ") str = span("error", 'A space: (" ")');
				else {
					val = val.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");//disarm character codes and html tags
					val = val.replace(/\r\n|\r|\n/g, span('text', 'NL') + '<br />');
					str = span("string", val);
				}
				if (str.length > 5007) str = str.slice(0, 5000) + "</span>" + span("text", "...etc. etc. " + str.length / 5000 + " times");
			}
			else if (typeof val === "boolean") {
				str = span("boolean", val);
			}
			else if (typeof val === "object") {
				if (val instanceof Date) str = span("date", val);
				else if (val instanceof Array) str = print_Array(val);
				else if (val instanceof Error) str = span("error", val.name + ": " + val.message, val.stack);
				else str = span("text", "{ " + print_Obj(val) + " }");
			}
			else str = span("error", "???: " + val);
			val = null!;
			return str;
		}
		function print_Array(arr: any[]) {
			var values: string[] = [], len = arr.length;
			if (len === 0) return span("array", '[ ' + span("error", "Empty array") + ' ]');
			for (var i = 0; i < len; i++) values[i] = print_Val(arr[i]);
			var str = span("array", '[ ' + values.join(", ") + ' ]');
			values = null!;
			arr = null!;
			return str;
		}
		function to_Readable_JSON(str: string) {
			function enter() {
				out += "<br />";
				for (a = 0; a < tabDepth; a++) {
					out += "&nbsp;&nbsp;&nbsp;&nbsp;";
				}
			}
			function getArrayDepth(position: number) {
				//look ahead from 'position' to see how deep the array is
				//if 2d or 3d array, add extra whitespace
				position++;
				for (let depth = 1, len = str.length; position < len; position++) {
					if (str[position] === "[") {
						depth++;
						if (depth > arrayDepth) arrayDepth = depth;
					}
					if (str[position] === "]") {
						depth--;
						if (depth === 0) {
							//end of array
							if (arrayDepth > 0) {
								arrayEnd = position;//set the end of the array position
								tabDepth++;
								enter();
							}
							return arrayDepth;
						}
					}
				}
				return 0;
			}
			var quote = false,
				tabDepth = 0,
				prevChar,
				out = "",
				a = 0,
				array = 0,
				arrayDepth = 0,
				arrayEnd = 0;
			for (let c = 0, len = str.length; c < len; c++) {
				if ((str[c] === "}" || str[c] === "]" && c === arrayEnd) && !quote) {
					tabDepth--;
					enter();
				}
				out += str[c];
				if (str[c] === '"' && prevChar !== "\\") quote = !quote;
				else if (!quote) {
					if (str[c] === "," /*&& (array === 0 || array < arrayDepth)*/) {
						enter();
						if (str[c + 1] === " ") c++; //skip space
					}
					else if (str[c] === "[") {
						if (c > arrayEnd) getArrayDepth(c);
						array++;
					}
					else if (str[c] === "]") {
						array--;
						if (array === 0) arrayDepth = 0;
					}
					else if (str[c] === "{") {
						tabDepth++;
						enter();
						if (str[c + 1] === " ") c++; //skip space
					}
				}
				prevChar = str[c];
			}
			return out;
		}
		function print_Obj(obj: {[key: string]: any}) {
			var pairs: string[] = [], a = 0, val;
			for (let key in obj) {
				val = obj[key];
				pairs[a] = key + ': ' + print_Val(val);
				a++;
				if (a > 25) {
					pairs[a] = "continued....";
					break;
				}
			}
			a = null!; obj = null!; val = null!;
			return pairs.join(",");
		}
		function toDebugDiv() {
			if (!/debugmodeOn/.test(HTML_TAG.className)) HTML_TAG.className = HTML_TAG.className + " debugmodeOn";
			var debugmessage = "<span class='debug-timestamp'>";
			debugmessage += timestamp;
			debugmessage += "    </span><br />&nbsp;&nbsp;";
			if (description) {
				if (severity || /error/i.test(description))
					debugmessage += span("error", description + " " + code);
				else debugmessage += description + " " + code;
			}
			else debugmessage += code;
			debugmessage += "<br />";
			debugmessage += DEBUG_MESSAGE_DIV.innerHTML;
			DEBUG_MESSAGE_DIV.innerHTML = debugmessage;
			debugmessage = null!;
		}
		function toConsole() {
			var consolemessage = timestamp;
			if (description) consolemessage += "   " + description + ":\n         ";
			consolemessage += "   ";
			consolemessage += code;
			console.log(consolemessage.replace(/<\/?span[^>]*>/g, "").replace(/<br \/>/g, "\n            ").replace(/&nbsp;/g, " "));
			consolemessage = null!;
		}
		if (DEBUG_TO_CONSOLE === true && (severity || description && /error/i.test(description))) {
			APP.setDebugMode(true);
		}
		if (DEBUG_MODE === true || DEBUG_TO_CONSOLE === true && console && console.log) {
			if (code instanceof Array) code = to_Readable_JSON(print_Array(code));
			else if (code instanceof Function) code = span('function', 'function() {...}');
			else if (code instanceof Date) code = span('date', code);
			else if (code === null || code === undefined) code = print_Val(code);
			else if (code instanceof Error) code = span("error", code.name + ": " + code.message, code.stack);
			else if (typeof code === "object") code = span('object', "{ " + to_Readable_JSON(print_Obj(code)) + " }");
			else code = print_Val(code);
		}
		if (DEBUG_MODE === true) toDebugDiv();
		if (DEBUG_TO_CONSOLE === true && console && console.log) toConsole();
		code = null!; description = null!;
	}
	function trim(str: string) {
		str = String(str);
		while (/\s\s/g.test(str)) str = str.replace(/\s\s/g, " ");
		if (str === " ") return "";
		return str.replace(/^\s+|\s+$/gm, "");
	}
	function layout() {
		var width = window.innerWidth !== null ? window.innerWidth :
			document.body !== null && document.body.clientWidth !== null ? document.body.clientWidth :
				window.screen !== null ? window.screen.availWidth : 0,
			type = "debugShowLarge ";
		if (width <= 640) type = "debugShowSmall ";
		HTML_TAG.className = trim(type + HTML_TAG.className.replace(/debugShowLarge|debugShowSmall/g, ""));
	}
	function init() {
		var stylesheet = document.createElement('style'),
			span = document.createElement('span');

		span.appendChild(document.createTextNode("\u2A2F"));//times symbol

		HIDE_DEBUG_BUTTON = document.createElement('button');
		HIDE_DEBUG_BUTTON.id = "hideDebug";
		HIDE_DEBUG_BUTTON.type = "button";
		HIDE_DEBUG_BUTTON.className = "close";
		HIDE_DEBUG_BUTTON.appendChild(span);

		DEBUG_MESSAGE_DIV = document.createElement('div');
		DEBUG_MESSAGE_DIV.id = "debugMsg";

		DEBUG_DIV = document.createElement('div');
		DEBUG_DIV.id = "debug";
		DEBUG_DIV.appendChild(HIDE_DEBUG_BUTTON);
		DEBUG_DIV.appendChild(DEBUG_MESSAGE_DIV);

		layout();

		stylesheet.type = 'text/css';
		// eslint-disable-next-line
		stylesheet.innerText = "#debug{display:none} #hideDebug{padding:6px 10px;color:red;position:fixed} html.debugShowLarge #hideDebug{left:25%;right:auto;right:initial} html.debugShowLarge #debug.debugRight #hideDebug{left:auto;left:initial;right:22px} html.debugShowSmall #hideDebug {left:auto;left:initial;right:12px} html.debugmodeOn #debug{color:#eee;background-color:#111;background-color:rgba(0,0,0,0.7);text-shadow:0 0 2px #000;font-family:Consolas,Courier New,Courier,monospace;position:fixed;top:0;left:0;right:auto;right:initial;width:30%;max-width:400px;height:100%;-ms-word-wrap:break-word;word-wrap:break-word;overflow:auto;visibility:visible;display:block;z-index:1099} html.debugmodeOn #debug.debugRight{left:auto;left:initial;right:0} html.debugShowSmall #debug{position:fixed;width:100%;max-width:100%;height:45%;top:auto;top:initial;bottom:0} html.debugShowSmall #debug.debugRight{top:0;bottom:auto;bottom:initial} .debug-object{color:cyan} .debug-function{color:magenta} .debug-error{color:red} .debug-string{color:lightblue} .debug-boolean{color:lightgreen} .debug-date{color:pink} .debug-number{color:yellow} .debug-text{color:white} .debug-array{color:orange} .debug-timestamp{color:#CCC;font-size:0.75em}";
		document.head.appendChild(stylesheet);

		window.document.body.insertBefore(DEBUG_DIV, window.document.body.firstChild);

		HIDE_DEBUG_BUTTON.addEventListener('click', changeDebugMode);
		DEBUG_DIV.addEventListener('click', moveDebugWindow);
		INITIATED = true;
	}
	function destroy() {
		if (HIDE_DEBUG_BUTTON) HIDE_DEBUG_BUTTON.removeEventListener('click', changeDebugMode);
		if (DEBUG_DIV) {
			DEBUG_DIV.removeEventListener('click', moveDebugWindow);
			window.document.body.removeChild(DEBUG_DIV);
		}
		if (HTML_TAG) HTML_TAG.className = trim(HTML_TAG.className.replace(/debugmodeOn|debugShowLarge|debugShowSmall/g, ""));
	}
	var DEBUG_COUNT = 0,
		DEBUG_TIME = new Date().getTime(),
		DEBUG_STOP = false,
		DEBUG_MODE = false,
		DEBUG_TO_CONSOLE = false,
		ERROR_CACHE: [string, any, string?, boolean?][] = [],
		CACHE_MSG_INDEX = 0,
		INITIATED = false,
		HIDE_DEBUG_BUTTON: HTMLButtonElement,
		DEBUG_DIV: HTMLDivElement,
		DEBUG_MESSAGE_DIV: HTMLDivElement,
		HTML_TAG:HTMLElement = document.getElementsByTagName("html")[0];

	APP.setDebugMode = function (debugMode: boolean): boolean {
		if (debugMode === true) {
			if (!INITIATED) init();
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
			APP.debug(debugMode, "Error: Cannot set DebugMode to", true);
		}
		return DEBUG_MODE;
	};
	APP.setDebugToConsole = function (debugMode: boolean): boolean {
		if (debugMode === true) {
			DEBUG_TO_CONSOLE = debugMode;
			while (CACHE_MSG_INDEX-- > 0) {
				_debug.apply(null, ERROR_CACHE[CACHE_MSG_INDEX]);
			}
			ERROR_CACHE = [];
		}
		else if (debugMode === false) DEBUG_TO_CONSOLE = debugMode;
		else {
			DEBUG_TO_CONSOLE = true;
			APP.debug(debugMode, "Error: Cannot set DebugToConsole to", true);
		}
		return DEBUG_TO_CONSOLE;
	};
	APP.cacheMsg = function (code: any, description?: string, severity?: boolean): void {
		if (DEBUG_MODE === true) APP.debug(code, description, severity);
		else {
			ERROR_CACHE[CACHE_MSG_INDEX] = [timeStamp(new Date()), code, description, severity];
			CACHE_MSG_INDEX++;
		}
	};
	/*prints a message to div called #debugMsg, like console.log*/
	APP.debug = function (code: any, description?: string, severity?: boolean): void {
		if (!INITIATED) return;
		var d = new Date();
		if (DEBUG_STOP === true && d.getTime() - DEBUG_TIME > 5000) {
			DEBUG_COUNT = 0;
			DEBUG_STOP = false;
		}
		if (DEBUG_STOP === false && DEBUG_COUNT > 250 && d.getTime() < DEBUG_TIME + 1000) {
			var debugmessage = "<br />--TOO MANY MESSAGES LOGGED--<br /><br />";
			debugmessage += DEBUG_MESSAGE_DIV.innerHTML;
			DEBUG_MESSAGE_DIV.innerHTML = debugmessage;
			debugmessage = null!;
			DEBUG_STOP = true;
		}
		if (DEBUG_STOP === false) {
			_debug(timeStamp(d), code, description, severity);
		}
		d = null!;
	};
}());