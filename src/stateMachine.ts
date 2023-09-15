/*
 * StateMachine.ts
 * TypeScript finite state machine class with async transformations using promises.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Callback = ((...args: any[]) => Promise<void>) | ((...args: any[]) => void) | undefined;

export interface ITransition<STATE, EVENT, CALLBACK extends Callback> {
  fromState: STATE;
  event: EVENT;
  toState: STATE;
  cb: CALLBACK;
}

export function t<STATE, EVENT, CALLBACK extends Callback>(
  fromState: STATE, event: EVENT, toState: STATE,
  cb?: CALLBACK): ITransition<STATE, EVENT, CALLBACK> {
  return { fromState, event, toState, cb };
}

export class StateMachine<STATE, EVENT extends string | number | symbol, CALLBACKS extends Record<EVENT, Callback> = Record<EVENT, Callback>> {

  protected _current: STATE;

  // initialize the state-machine
  constructor(
    _init: STATE,
    protected transitions: ITransition<STATE, EVENT, CALLBACKS[EVENT]>[] = [],
  ) {
    this._current = _init;
  }

  addTransitions(transitions: ITransition<STATE, EVENT, CALLBACKS[EVENT]>[]): void {

    // bind any unbound method
    transitions.forEach((_tran) => {
      const tran: ITransition<STATE, EVENT, CALLBACKS[EVENT]> = Object.create(_tran);
      if (tran.cb && !tran.cb.name?.startsWith("bound ")) {
        tran.cb = tran.cb.bind(this);
      }
      this.transitions.push(tran);
    });
  }

  getState(): STATE { return this._current; }

  can(event: EVENT): boolean {
    return this.transitions.some((trans) => (trans.fromState === this._current && trans.event === event));
  }

  isFinal(): boolean {
    // search for a transition that starts from current state.
    // if none is found it's a terminal state.
    return this.transitions.every((trans) => (trans.fromState !== this._current));
  }

  // post event async
  async dispatch<E extends EVENT>(event: E, ...args: Parameters<CALLBACKS[E]>): Promise<void> {
    return new Promise<void>((resolve, reject) => {

      // delay execution to make it async
      setTimeout((me: this) => {

        // find transition
        const found = this.transitions.some((tran) => {
          if (tran.fromState === me._current && tran.event === event) {
            me._current = tran.toState;
            if (tran.cb) {
              try {
                const p = tran.cb(...args);
                if (p instanceof Promise) {
                  p.then(resolve).catch((e: Error) => reject(e));
                } else {
                  resolve();
                }
              } catch (e) {
                console.error("Exception caught in callback", e);
                reject(e);
              }
            } else {
              resolve();
            }
            return true;
          }
          return false;
        });

        // no such transition
        if (!found) {
          console.error(`No transition: from ${me._current} event ${event}`);
          reject();
        }
      }, 0, this);
    });
  }
}
