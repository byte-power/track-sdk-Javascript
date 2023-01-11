export default function Echo() {
    var queue = [];
    var ECHO_TOKEN = {};
    var RESET_INPUT = "%c ";
    var RESET_CSS = "";

    // Attach formatting utility method.
    function alertFormatting(value) {

        queue.push({
            value: value,
            css: "display: inline-block ; background-color: #e0005a ; color: #ffffff ; font-weight: bold ; padding: 3px 7px 3px 7px ; border-radius: 3px 3px 3px 3px ;"
        });

        return (ECHO_TOKEN);

    }

    // Attach formatting utility method.
    function warningFormatting(value) {

        queue.push({
            value: value,
            css: "display: inline-block ; background-color: gold ; color: black ; font-weight: bold ; padding: 3px 7px 3px 7px ; border-radius: 3px 3px 3px 3px ;"
        });

        return (ECHO_TOKEN);

    }

    // I provide an echo-based proxy to the given Console Function. This uses an
    // internal queue to aggregate values before calling the given Console
    // Function with the desired formatting.
    function using(consoleFunction) {

        function consoleFunctionProxy() {

            // As we loop over the arguments, we're going to aggregate a set of
            // inputs and modifiers. The Inputs will ultimately be collapsed down
            // into a single string that acts as the first console.log parameter
            // while the modifiers are then SPREAD into console.log as 2...N.
            // --
            // NOTE: After each input/modifier pair, I'm adding a RESET pairing.
            // This implicitly resets the CSS after every formatted pairing.
            var inputs = [];
            var modifiers = [];

            for (var i = 0; i < arguments.length; i++) {

                // When the formatting utility methods are called, they return
                // a special token. This indicates that we should pull the
                // corresponding value out of the QUEUE instead of trying to
                // output the given argument directly.
                if (arguments[i] === ECHO_TOKEN) {

                    var item = queue.shift();

                    inputs.push(("%c" + item.value), RESET_INPUT);
                    modifiers.push(item.css, RESET_CSS);

                    // For every other argument type, output the value directly.
                } else {

                    var arg = arguments[i];

                    if (
                        (typeof (arg) === "object") ||
                        (typeof (arg) === "function")
                    ) {

                        inputs.push("%o", RESET_INPUT);
                        modifiers.push(arg, RESET_CSS);

                    } else {

                        inputs.push(("%c" + arg), RESET_INPUT);
                        modifiers.push(RESET_CSS, RESET_CSS);

                    }

                }

            }

            consoleFunction(inputs.join(""), ...modifiers);

            // Once we output the aggregated value, reset the queue. This should have
            // already been emptied by the .shift() calls; but the explicit reset
            // here acts as both a marker of intention as well as a fail-safe.
            queue = [];

        }

        return (consoleFunctionProxy);

    }

    return ({
        // Console(ish) functions.
        log: using(console.log),
        warn: using(console.warn),
        error: using(console.error),
        trace: using(console.trace),
        group: using(console.group),
        groupEnd: using(console.groupEnd),

        // Formatting functions.
        asAlert: alertFormatting,
        asWarning: warningFormatting
    });

}


// export default class Echo {
//     queue = []
//     ECHO_TOKEN = {}
//     RESET_INPUT = "%c "
//     RESET_CSS = ""

//     alertFormatting() {

//         queue.push({
//             value: value,
//             css: "display: inline-block ; background-color: #e0005a ; color: #ffffff ; font-weight: bold ; padding: 3px 7px 3px 7px ; border-radius: 3px 3px 3px 3px ;"
//         });

//         return (ECHO_TOKEN);
//     }

//     warningFormatting() {

//         queue.push({
//             value: value,
//             css: "display: inline-block ; background-color: gold ; color: black ; font-weight: bold ; padding: 3px 7px 3px 7px ; border-radius: 3px 3px 3px 3px ;"
//         });

//         return (ECHO_TOKEN);
//     }

//     using(consoleFunction) {
//         function consoleFunctionProxy() {

//             // As we loop over the arguments, we're going to aggregate a set of
//             // inputs and modifiers. The Inputs will ultimately be collapsed down
//             // into a single string that acts as the first console.log parameter
//             // while the modifiers are then SPREAD into console.log as 2...N.
//             // --
//             // NOTE: After each input/modifier pair, I'm adding a RESET pairing.
//             // This implicitly resets the CSS after every formatted pairing.
//             var inputs = [];
//             var modifiers = [];

//             for (var i = 0; i < arguments.length; i++) {

//                 // When the formatting utility methods are called, they return
//                 // a special token. This indicates that we should pull the
//                 // corresponding value out of the QUEUE instead of trying to
//                 // output the given argument directly.
//                 if (arguments[i] === ECHO_TOKEN) {

//                     var item = queue.shift();

//                     inputs.push(("%c" + item.value), RESET_INPUT);
//                     modifiers.push(item.css, RESET_CSS);

//                     // For every other argument type, output the value directly.
//                 } else {

//                     var arg = arguments[i];

//                     if (
//                         (typeof (arg) === "object") ||
//                         (typeof (arg) === "function")
//                     ) {

//                         inputs.push("%o", RESET_INPUT);
//                         modifiers.push(arg, RESET_CSS);

//                     } else {

//                         inputs.push(("%c" + arg), RESET_INPUT);
//                         modifiers.push(RESET_CSS, RESET_CSS);

//                     }

//                 }

//             }

//             consoleFunction(inputs.join(""), ...modifiers);

//             // Once we output the aggregated value, reset the queue. This should have
//             // already been emptied by the .shift() calls; but the explicit reset
//             // here acts as both a marker of intention as well as a fail-safe.
//             queue = [];

//         }

//         return (consoleFunctionProxy);
//     }

//     // Console(ish) functions.
//     log = using(console.log)
//     warn = using(console.warn)
//     error = using(console.error)
//     trace = using(console.trace)
//     group = using(console.group)
//     groupEnd = using(console.groupEnd)

//     // Formatting functions.
//     asAlert = alertFormatting
//     asWarning = warningFormatting

// }