# debugmode (with Modules)
The more modern method to include a JavaScript file in your project is to use JavaScript modules.

> Note: A limitation of using JavaScript modules is you will need to serve the file from a server (such as localhost:// or https://, not file://).

### The JavaScript Module Import Method
Include the debugmode.min.js
file, from this folder, in your project. Then load the file using an `import` statement.

```HTML
<!--index.html--> 
<script type="module" src="[path/to]/main.js"></script>
```

```JavaScript
// main.js
import { debug, setDebugMode, setDebugToConsole, cacheMsg } from '[path/to/scripts]/debugmode.min.js'
```

### The Typescript Module Import Method
Typescript follows the same pattern as JavaScript modules, except you incude the .ts file instead of the .min.js file.
```Typescript
// main.ts
import { debug, setDebugMode, setDebugToConsole, cacheMsg } from '[path/to/scripts]/debugmode'
```
Then run the Typescript compiler to compile your own JavaScript files.

## The functions
Debugmode exposes 4 functions that can be imported:

#### `setDebugMode` and `debug`

```javascript
//main.js

import { setDebugMode, debug } from './scripts/debugmode.min.js'

setDebugMode(true); //set to true to use the debugger during development
debug(whatsThis, "This is where you put a description of the item you are inspecting", true);
```

Unlike `console.log`, you can't pass an unlimited number of arguments to `debug`, but it does accept 
up to 3. The first can be anything such as a string, number, object, array, function, date object, 
etc. The second accepts a string, which is used for a description. And the 3rd is to indicate that 
this is an error state. Alternately, the word 'error' anywhere in the description will mark the item 
as an error. (See [the main README.md](../README.md#errors) file for more information on errors)

#### `setDebugToConsole`
Debugmode integrates with the console when you want it to by calling

```javascript
import { setDebugToConsole, debug } from './scripts/debugmode.min.js'

setDebugToConsole(true); //false to quit logging to the console
debug(whatsThis, "Now you are writing to the console");
```

This is in addition to printing to the screen. You can log only to the console if you like by setting `setDebugMode(false)` and `setDebugToConsole(true)`.

#### `cacheMsg`
Don't like the debugmode overlay popping up over your app all the time when you aren't using it, 
but still want to log events in the background to access them if needed? You can cache logged items 
using `cacheMsg`, and then set debugMode to true at a later time to spit out the entire log.

```javascript
import { cacheMsg } from './scripts/debugmode.min.js'
cacheMsg(whatsThis,"description", false); //accepts the same arguments as debug
```

This can be used in one of 2 ways:

1. cache events as they happen when everything is running smoothly, but if an error is thrown, activate debugmode, showing you the whole log
1. include some form of control, like a button to change debugMode to true, displaying the entire log. (I like to hide it even better by creating a secret code word in a search field or login form that toggles debugMode)

Note: this cache can get very big very quickly slowing down the performace of your app or website, 
so be careful how many things you decide to cache.
