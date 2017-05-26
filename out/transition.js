"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Transition {
    constructor(fromState, event, cb, toState) {
        this.fromState = fromState;
        this.event = event;
        this.cb = cb;
        this.toState = toState;
    }
    toString() {
        return this.fromState.toString() + "|" + this.event.toString() + "|" + this.cb.name + "|" + this.toState.toString();
    }
}
exports.Transition = Transition;
