/* 
 * ts-state-machine.ts
 * TypeScript state-machine library with async transformation using promises.
 */

import { Transition } from "./";


export class StateMachine<STATE, EVENT> {

    protected current: STATE;

    // initalize the state-machine 
    public constructor(
        protected readonly initState: STATE,
        protected readonly transitions: Array<Transition<STATE, EVENT>>,
        protected readonly hookAfterChange?: (trans: Transition<STATE, EVENT>) => void,
        protected readonly hookOnFail?: (trans: Transition<STATE, EVENT>, res: number) => void
    ) {
        this.current = initState;
    }


    public getState(): STATE { return this.current; }

    public can(event: EVENT): boolean {

        for (const trans of this.transitions){
            if (trans.fromState === this.current && trans.event === event) {
                return true;
            }
        }

        return false;
    }

    public isFinal(): boolean {
        // search for a transition that starts from current state.
        // if none is found its a terminal state.
        for (const trans of this.transitions) {
            if (trans.fromState === this.current) {
                return false;
            }
        }

        return true;
    }

    public go(event: EVENT, ...args: any[]): boolean {

        // find transition
        let i = 0;
        for (; i < this.transitions.length; i++) {
            const trans = this.transitions[i];
            if (trans.fromState === this.current && trans.event === event){
                break;
            }
        }

        if (i >= this.transitions.length){
            return false;  // no such transition
        }

        // run transition callback and act on promise
        const trans = this.transitions[i];
        trans.cb(args).then((res: number) => {

            // check results, update state and call callbacks
            if (!res) {
                this.current = trans.toState;
                if (this.hookAfterChange) { this.hookAfterChange(trans); }
            } else {
                if (this.hookOnFail) { this.hookOnFail(trans, res); }
            }
        });

        return true; // transition in progress
    }

}
