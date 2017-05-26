"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("./");
// tslint:disable:max-classes-per-file
// tslint:disable:no-console
// --- test file for ts-state-machine ---
var States;
(function (States) {
    States[States["closed"] = 0] = "closed";
    States[States["opened"] = 1] = "opened";
    States[States["broken"] = 2] = "broken";
})(States || (States = {}));
;
var Events;
(function (Events) {
    Events[Events["open"] = 0] = "open";
    Events[Events["close"] = 1] = "close";
    Events[Events["break"] = 2] = "break";
})(Events || (Events = {}));
;
class Trans2 extends _1.Transition {
}
;
const trans = [
    //          fromState      event         callback    toState
    new _1.Transition(States.closed, Events.open, onOpen, States.opened),
    new _1.Transition(States.opened, Events.close, onClose, States.closed),
    new _1.Transition(States.opened, Events.break, onBreak, States.broken),
    new _1.Transition(States.closed, Events.break, onBreak, States.broken)
];
// initialize the state machine
const door = new _1.StateMachine(States.closed, // initial state
trans, // array of transitions 
hookAfterChange, // (trans: Transition<STATE, EVENT>) => void,
hookOnFail // (trans: Transition<STATE, EVENT>, res: number) => void
);
function hookAfterChange(t) {
    console.log("hookAfterChange:" + t);
}
function hookOnFail(t, res) {
    console.log("hookOnFail:" + t + " res:" + res);
}
// transition callbacks
function onOpen(...args) {
    console.log("onOpen...");
    const resolveCode = args[0][0];
    const p = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(resolveCode);
        }, 200);
    });
    return p;
}
function onClose(...args) {
    console.log("onClose...");
    const resolveCode = args[0][0];
    const p = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(resolveCode);
        }, 200);
    });
    return p;
}
function onBreak(...args) {
    console.log("onBreak...");
    const resolveCode = args[0][0];
    const p = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(resolveCode);
        }, 200);
    });
    return p;
}
door.getState(); // === States.closed
door.can(Events.open); // === true
door.go(Events.open); // start an async open 
