var LOGMODE = {
    CONSOLE : {value: 0, name: "console"}, 
    ARRAY : {value: 1, name: "array"},
    ALL : {value: 2, name: "all"}
};

log = new Object();       // global object for logging

log.mode = LOGMODE.CONSOLE;   // choose which way to output (see enum def above)
log.maxstore = 100;       // Maximum of log entries in store

log.store = new Array();

// mapping logging to selected channel
log.info        = function (input) { log[log.mode.name](input, "info"); }
log.warn        = function (input) { log[log.mode.name](input, "warn"); }
log.error       = function (input) { log[log.mode.name](input, "error"); }
log.debug       = function (input) { log[log.mode.name](input, "debug"); }
log.todo        = function (input) { log[log.mode.name](input, "todo"); }
log.deprecated  = function (input) { log[log.mode.name](input, "deprecated"); }
log.events      = function (input) { log[log.mode.name](input, "events"); }
log.parentHTML  = function (input) { log[log.mode.name](input, "parenthtml"); }
log.obj  		= function (input) { log[log.mode.name](input, "obj"); }

// Log function information
// typical usage: log.fn();
log.fn = function (detail, isNew) {
    var result = "";
    switch (detail) {
        case 2:
            result = ">> function: " + arguments.callee.caller;
            break;
        case 1:
            result = ">> " + arguments.callee.caller.toString().split("{")[0];
            break;
        case 0:
        default:
            result = "> function: " + arguments.callee.caller.name;    
    }
    if (isNew) {
        result = ":: UNDER CONSTRUCTION :: " + output;
    }
    log.info(result);    
}

// success callback logging
log.successFN = function (successFunction, idString) {
    log.info("Success when executing: " + idString);
    successFunction();
}

// error callback logging
log.errorFN = function (errorFunction, idString) {
    log.error("Error when executing: " + idString);
    errorFunction();
}

/*
 *  Output handling
 */

// ... to console
log.console = function (input, level) {
    if (LOGGING != "off") { 
        if ("error" == level.toLowerCase()) {
            console.error(input); 
            
        } else if ("warn" == level.toLowerCase()) {
            console.warn(input);
            
        } else if ("debug" == level.toLowerCase()) {
            console.debug("DEBUG:::: " + input);
            
        } else if ("obj" == level.toLowerCase()) {
    		var output = "";
    		if (typeof input == "object") {
    			for(key in input) {
    				if (typeof input[key] != "function") {
    					output += " " + key + ": " + input[key] + ",";
    				}
    			}
    			if (output != "") {
    				output = output.substr(0, output.length - 1);
    				console.info("Object {" + output + "}");
    			}
    		}
            
        } else if ("parenthtml" == level.toLowerCase()) {
            console.log("HMTL $(" + input + ").parent: ");

        } else if ("todo" == level.toLowerCase()) {
            console.log("--==--==--==--==--==--==--==--==--==--==--==--==--==--==--");
            console.log("Something still needs to be done here -==-> TODO:::: " + input );
            console.log("--==--==--==--==--==--==--==--==--==--==--==--==--==--==--");
            
        } else if ("events" == level.toLowerCase()) {
            console.log("Logging events for:");
            if(typeof input == "object") {
                log.obj(input);
                log.obj(input.data("events"));
            } else {
                console.log(input);
                console.log(input.data("events"));
            }
            
        } else { // default: info
            console.log(input);
        }
    }
}

// ... to array
log.array = function (input, level) {
    if (log.maxstore <= log.store.length) {
        log.store.shift(); // remove first element of the array
    }
    timestamp = new Date();
    log.store.push(timestamp.toLocaleString() + " [" +level.toUpperCase() + "] " + input);
}

// ... to all
log.all = function (input, level) {
    for (mode in LOGMODE) {
        modename = LOGMODE[mode].name;
        if ("all" != modename.toLowerCase()) {
            log[modename](input, level);
        }
    }
}
