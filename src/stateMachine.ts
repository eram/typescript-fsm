/*
 * StateMachine.ts
 * TypeScript finite state machine class with async transformations using promises.
 */

// tslint:disable:no-any

export interface ITransition<STATE, EVENT> {
    fromState: STATE;
    event: EVENT;
    toState: STATE;
    cb?: (...args: any[]) => void|Promise<void>;
}

export function tFrom<STATE, EVENT>(
    fromState: STATE, event: EVENT, toState: STATE,
    cb?: (...args: any[]) => void|Promise<void>): ITransition<STATE, EVENT> {
    return { fromState, event, toState, cb };
}

export class StateMachine<STATE, EVENT> {

    protected current: STATE;
    protected transitions: Array<ITransition<STATE, EVENT>>;

    // initalize the state-machine
    constructor(
        initState: STATE,
        transitions: Array<ITransition<STATE, EVENT>> = [],
    ) {
        this.current = initState;
        this.transitions = transitions;
    }

    addTransitions(transitions: Array<ITransition<STATE, EVENT>>): void {
        transitions.forEach((tran) => this.transitions.push(tran));
    }

    getState(): STATE { return this.current; }

    can(event: EVENT): boolean {

        for (const trans of this.transitions) {
            if (trans.fromState === this.current && trans.event === event) {
                return true;
            }
        }

        return false;
    }

    isFinal(): boolean {
        // search for a transition that starts from current state.
        // if none is found it's a terminal state.
        for (const trans of this.transitions) {
            if (trans.fromState === this.current) {
                return false;
            }
        }

        return true;
    }

    // post event asynch
    dispatch(event: EVENT, ...args: any[]): Promise<void> {

        return new Promise<void>((resolve, reject) => {

            // delay execution to make it async
            setTimeout(async (me: this) => {
                let found = false;

                // find transition
                for (const tran of me.transitions) {
                    if (tran.fromState === me.current && tran.event === event) {

                        me.current = tran.toState;
                        found = true;
                        if (tran.cb) {
                            try {
                                await tran.cb(args);
                                resolve();
                            } catch (e) {
                                reject("Exception caught in callback");
                            }
                        } else {
                            resolve();
                        }
                        break;
                    }
                }

                // no such transition
                if (!found) {
                    reject(`no such transition: from ${me.current.toString()} event ${event.toString()}`);
                }
            }, 1, this);
        });
    }
}
