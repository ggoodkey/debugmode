var APP = APP || {};
(function () {
	"use strict";
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
	function timeStamp(d) {
		var m = d.getMinutes(), s = d.getSeconds(), x = d.getMilliseconds();
		DEBUG_COUNT++;
		DEBUG_TIME = d.getTime();
		/* add a zero in front of numbers<10 */
		m = m < 10 ? "0" + m : m;
		s = s < 10 ? "0" + s : s;
		x = x < 10 ? "0" + x : x;
		x = x < 100 ? "0" + x : x;
		return m + ":" + s + ":" + x;
	}
	function debug(code, description, severity, timestamp) {
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
			str += contents;
			str += '</span>';
			return str;
		}
		function print_Val(val) {
			var str = "";
			if (val instanceof Function) str = span('function', 'function() {...}');
			else if (typeof val === "number") {
				if (val > 1500000000000 && val < 2000000000000) str = span('number', val, new Date(val));
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
				if (str.length > 5007) str = str.slice(0, 5000) + "</span>" + span("text", "...etc. etc. " + parseInt(str.length / 5000) + " times");
			}
			else if (typeof val === "boolean") {
				str = span("boolean", val);
			}
			else if (typeof val === "object") {
				if (val instanceof Date) str = span("date", val);
				else if (val instanceof Array) str = print_Array(val);
				else str = span("text", "{ " + print_Obj(val) + " }");
			}
			else str = span("error", "???: " + val);
			val = null;
			return str;
		}
		function print_Array(arr) {
			var values = [], len = arr.length;
			if (len === 0) return span("array", '[ ' + span("error", "Empty array") + ' ]');
			for (var i = 0; i < len; i++) values[i] = print_Val(arr[i]);
			var str = span("array", '[ ' + values.join(", ") + ' ]');
			values = null;
			arr = null;
			return str;
		}
		function print_Obj(obj) {
			var pairs = [], a = 0, val;
			for (var key in obj) {
				val = obj[key];
				pairs[a] = key + ': ' + print_Val(val);
				a++;
				if (a > 50) {
					pairs[a] = "continued....";
					break;
				}
			}
			a = null; obj = null; key = null; val = null;
			return pairs.join(",<br />");
		}
		if (DEBUG_MODE === true || DEBUG_TO_CONSOLE === true && console && console.log) {
			if (code instanceof Array) code = print_Array(code);
			else if (code instanceof Function) code = span('function', 'function() {...}');
			else if (code instanceof Date) code = span('date', code);
			else if (typeof code === "object") code = span('object', "{ " + print_Obj(code) + " }");
			else code = print_Val(code);
		}
		if (DEBUG_MODE === true) {
			if (!/debugmodeOn/.test(HTML_TAG.className)) HTML_TAG.className = HTML_TAG.className + " debugmodeOn";
			var debugmessage = "<span class='debug-timestamp'>";
			debugmessage += timestamp;
			debugmessage += "    </span><br />&nbsp;&nbsp;";
			if (description) {
				if (severity !== undefined || /error/i.test(description))
					debugmessage += span("error", description + " " + code);
				else debugmessage += description + " " + code;
			}
			else debugmessage += code;
			debugmessage += "<br />";
			debugmessage += DEBUG_MESSAGE_DIV.innerHTML;
			DEBUG_MESSAGE_DIV.innerHTML = debugmessage;
			debugmessage = null;
		}
		if (DEBUG_TO_CONSOLE === true && console && console.log) {
			var consolemessage = timestamp;
			if (description) consolemessage += "   " + description + ":\n         ";
			consolemessage += "   ";
			consolemessage += code;
			console.log(consolemessage.replace(/<\/?span[^>]*>/g, "").replace(/<br \/>/g, "\n            "));
			consolemessage = null;
		}
		code = null; description = null;
	}
	function layout() {
		function trim(str) {
			str = String(str);
			while (/\s\s/g.test(str)) str = str.replace(/\s\s/g, " ");
			if (str === " ") return "";
			return str.replace(/^\s+|\s+$/gm, "");
		}
		var width = window.innerWidth !== null ? window.innerWidth : document.body !== null && document.body.clientWidth !== null ? document.body.clientWidth : window.screen !== null ? window.screen.availWidth : 0,
			type = "debugShowLarge ";
		if (width <= 640) type = "debugShowSmall ";
		HTML_TAG.className = trim(type + HTML_TAG.className.replace(/debugShowLarge|debugShowSmall/g, ""));
	}
	function init() {
		var stylesheet = document.createElement('style'),
			span = document.createElement('span');

		span["aria-hidden"] = true;
		span.appendChild(document.createTextNode("\u2A2F"));//times symbol

		HIDE_DEBUG_BUTTON = document.createElement('button');
		HIDE_DEBUG_BUTTON.id = "hideDebug";
		HIDE_DEBUG_BUTTON.type = "button";
		HIDE_DEBUG_BUTTON.class = "close";
		HIDE_DEBUG_BUTTON["aria-label"] = "Close debug window";
		HIDE_DEBUG_BUTTON.appendChild(span);

		DEBUG_MESSAGE_DIV = document.createElement('div');
		DEBUG_MESSAGE_DIV.id = "debugMsg";

		DEBUG_DIV = document.createElement('div');
		DEBUG_DIV.id = "debug";
		DEBUG_DIV.appendChild(HIDE_DEBUG_BUTTON);
		DEBUG_DIV.appendChild(DEBUG_MESSAGE_DIV);

		layout();

		stylesheet.type = 'text/css';
		stylesheet.innerText = "#debug {display: none;} #hideDebug {padding: 6px 10px;color: red;position: fixed;} html.debugShowLarge #hideDebug {left: 25%;right: auto;right: initial;} html.debugShowLarge #debug.debugRight #hideDebug {left: auto;left: initial;right: 22px;} html.debugShowSmall #hideDebug {left: auto;left: initial;right: 12px;} html.debugmodeOn #debug {color: #eee;background-color: #111;background-color: rgba(0, 0, 0, 0.7);text-shadow: 0 0 2px #000;font-family: Consolas, Courier New, Courier, monospace;position: absolute;top: 0;left: 0;right: auto;right: initial;width: 30%;max-width: 400px;height: 100%;-ms-word-wrap: break-word;word-wrap: break-word;overflow: auto;visibility: visible;display: block;z-index: 1099;} html.debugmodeOn #debug.debugRight {left: auto;left: initial;right: 0;} html.debugShowSmall #debug {position: fixed;width: 100%;max-width: 100%;height: 45%;top: auto;top: initial;bottom: 0;} html.debugShowSmall #debug.debugRight {top: 0;bottom: auto;bottom: initial;} .debug-object {color: cyan;} .debug-function {color: magenta;}.debug-error {color: red;}.debug-string {color: lightblue;}.debug-boolean {color: lightgreen;}.debug-date {color: pink;}.debug-number {color: yellow;}.debug-text {color: white;}.debug-array {color: orange;}.debug-timestamp {color: #CCC;font-size: 0.75em;}";
		document.head.appendChild(stylesheet);

		window.document.body.insertBefore(DEBUG_DIV, window.document.body.firstChild);

		HIDE_DEBUG_BUTTON.addEventListener('click', changeDebugMode);
		DEBUG_DIV.addEventListener('click', moveDebugWindow);
		INITIATED = true;
	}
	function destroy() {
		HIDE_DEBUG_BUTTON.removeEventListener('click', changeDebugMode);
		DEBUG_DIV.removeEventListener('click', moveDebugWindow);
		window.document.body.removeChild(DEBUG_DIV);
		HTML_TAG.className = HTML_TAG.className.replace(/debugmodeOn/g, "");
	}
	var DEBUG_COUNT = 0,
		DEBUG_TIME = new Date().getTime(),
		DEBUG_STOP = false,
		DEBUG_MODE = false,
		DEBUG_TO_CONSOLE = false,
		ERROR_CACHE = [],
		CACHE_MSG_INDEX = 0,
		INITIATED = false,
		HIDE_DEBUG_BUTTON,
		DEBUG_DIV,
		DEBUG_MESSAGE_DIV,
		HTML_TAG = document.getElementsByTagName("html")[0];

	APP.setDebugMode = function (debugMode) {
		var str = debugMode;
		if (debugMode === true || /y|true/g.test(str)) {
			if (!INITIATED) init();
			debugMode = true;
			while (CACHE_MSG_INDEX) {
				CACHE_MSG_INDEX--;
				debug(ERROR_CACHE[CACHE_MSG_INDEX]);
			}
			ERROR_CACHE = [];
		}
		else if (debugMode === false || /n|f/g.test(str)) {
			destroy();
			INITIATED = false;
			debugMode = false;
		}
		else {
			DEBUG_MODE = true;
			APP.debug(span("error", "Error: Cannot set DEBUGMODE to " + debugMode));
		}
		DEBUG_MODE = debugMode;
		return debugMode;
	};
	APP.setDebugToConsole = function (debugMode) {
		var str = debugMode;
		if (debugMode === true || /y|true/g.test(str)) {
			debugMode = true;
			while (CACHE_MSG_INDEX) {
				CACHE_MSG_INDEX--;
				debug(ERROR_CACHE[CACHE_MSG_INDEX]);
			}
			ERROR_CACHE = [];
		}
		else if (debugMode === false || /n|f/g.test(str)) debugMode = false;
		else {
			DEBUG_TO_CONSOLE = true;
			APP.debug(span("error", "Error: Cannot set DEBUGTOCONSOLE to " + debugMode));
		}
		DEBUG_TO_CONSOLE = debugMode;
		return debugMode;
	};
	APP.CacheMsg = function (msg, description, severity) {
		if (DEBUG_MODE === true) debug(msg, description);
		else {
			ERROR_CACHE[CACHE_MSG_INDEX] = [timeStamp(new Date()), description, msg, severity];
			CACHE_MSG_INDEX++;
		}
	};
	/*prints a message to div called #debugMsg, like console.log*/
	APP.debug = function (code, description, severity) {
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
			debug(code, description, severity, timeStamp(d));
		}
		d = null;
	};
})();