"use strict";

// This type of error is used when you need to move back through call stack
// but don't necessarily want to show the scary and verbose unhandled exception
// screen to users. Note that throwing this error doesn't make any difference
// unless you have a catching side as well.
class HandledError extends Error {
}

module.exports = HandledError;
