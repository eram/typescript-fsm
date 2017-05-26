"use strict";
/*
 * ts-state-machine.ts
 * TypeScript state-machine library with async transformation using promises.
 */
Object.defineProperty(exports, "__esModule", { value: true });
class StateMachine {
    // initalize the state-machine 
    constructor(initState, transitions, hookAfterChange, hookOnFail) {
        this.initState = initState;
        this.transitions = transitions;
        this.hookAfterChange = hookAfterChange;
        this.hookOnFail = hookOnFail;
        this.current = initState;
    }
    getState() { return this.current; }
    can(event) {
        for (const trans of this.transitions) {
            if (trans.fromState === this.current && trans.event === event) {
                return true;
            }
        }
        return false;
    }
    isFinal() {
        // search for a transition that starts from current state.
        // if none is found its a terminal state.
        for (const trans of this.transitions) {
            if (trans.fromState === this.current) {
                return false;
            }
        }
        return true;
    }
    go(event, ...args) {
        // find transition
        let i = 0;
        for (; i < this.transitions.length; i++) {
            const trans = this.transitions[i];
            if (trans.fromState === this.current && trans.event === event) {
                break;
            }
        }
        if (i >= this.transitions.length) {
            return false; // no such transition
        }
        // run transition callback and act on promise
        const trans = this.transitions[i];
        trans.cb(args).then((res) => {
            // check results, update state and call callbacks
            if (!res) {
                this.current = trans.toState;
                if (this.hookAfterChange) {
                    this.hookAfterChange(trans);
                }
            }
            else {
                if (this.hookOnFail) {
                    this.hookOnFail(trans, res);
                }
            }
        });
        return true; // transition in progress
    }
}
exports.StateMachine = StateMachine;
