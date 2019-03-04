# debugmode
Ever been frustrated by the fact that you can't debug your website, or mobile web app on an actual mobile browser because it lacks a console? DUN DA DA DA DUN!! Enter *debugmode*, a console like overlay for testing JavaScript code in browsers that do not support console.log, i.e. mobile browsers.

Drop the debugmode.js, or debugmode.min.js file into your scripts folder, add a script tag to your html file to load it into your project and start debugging.

```HTML 
<!--html-->
<script type="text/javascript" src="[path/to/scripts]/debugmode.min.js"></script>
```

### APP.debug and APP.setDebugMode
```javascript
//Javascript
APP.setDebugMode(true); //set to true to use the debugger during development
var debug = APP.debug; //shortform access to APP.debug
debug(whatsThis, "This where you put a description of the item you are inspecting");
```
Unlike console.log, you can't pass an unlimited number of arguments to debugmode, but it does accept up to 3. The first can be anything such as a string, number, object, array, function, date object, etc. The second accepts a string, which is used for a description. And the 3rd is to indicate that this is an error state. Alternately, the word 'error' anywhere in the description will mark the item as an error. (More on errors later)

### APP.debugToConsole
Debugmode integrates with the console when you want it to by calling

```javascript
APP.setDebugToConsole(true); //false to quit logging to the console
```

### APP.cacheMsg
Don't like the debugmode overlay popping up over your app all the time when you aren't using it, but still want to log events in the background to access them if needed? You can cache logged items using APP.cacheMsg, and then set debugMode to true at a later time to spit out the entire log.

This can be used in one of 2 ways:

1. cache events as they happen when everthing is running smoothly, but if an error is thrown, activate debugmode, showing you the whole log
1. include some form of control, like a button to change debugMode to true, displaying the entire log. (I like to hide it even better by creating a secret code word in a search field or login form that toggles debugMode)

Note: this cache can get very big very quickly slowing down the performace of your app or website, so be careful how many things you decide to cache.

### Formatting
To help quickly differentiate data types, a colour coding scheme has been implemented

Item|Text Colour
----|----
Description|White
Strings|Lightblue
Numbers|Yellow
Booleans|Lightgreen
Arrays|Orange
Objects|Cyan
Functions|Magenta
Dates|Pink
Errors|Red

### Errors
Marking an item as an error, or just including the word "error" in the description will mark the item in red, helping you to notice and locate errors more quickly. Empty strings ("\") will be clearly printed out in red *Empty String ("\")*, and the values *null* and *undefined* will show up in red as well to differentiate them from the string values "null" and "undefined".

## Limitations
Strings passed to debugmode will be truncated at 5000 charactors, objects at 50 key:value pairs. Only 250 events will be logged per second, afterwhich you will get:

*--TOO MANY MESSAGES LOGGED--*

The counter will reset after 5 seconds.