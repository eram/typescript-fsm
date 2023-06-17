/*
 * StateMachine.ts
 * TypeScript finite state machine class with async transformations using promises.
 */

export type Callback = ((...args: unknown[]) => Promise<void>) | ((...args: unknown[]) => void) | undefined;

export interface ITransition<STATE, EVENT> {
  fromState: STATE;
  event: EVENT;
  toState: STATE;
  cb: Callback;
}

export function t<STATE, EVENT>(
  fromState: STATE, event: EVENT, toState: STATE,
  cb?: Callback) {
  return { fromState, event, toState, cb };
}

export class StateMachine<STATE, EVENT> {

  protected _current: STATE;

  // initialize the state-machine
  constructor(
    _init: STATE,
    protected transitions: ITransition<STATE, EVENT>[] = [],
  ) {
    this._current = _init;
  }

  addTransitions(transitions: ITransition<STATE, EVENT>[]): void {

    // bind any unbound method
    transitions.forEach((_tran) => {
      const tran: ITransition<STATE, EVENT> = Object.create(_tran);
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
  async dispatch(event: EVENT, ...args: unknown[]): Promise<void> {
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
                  void tran.cb(...args);
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
          console.error(`No transition: from ${me._current.toString()} event ${event.toString()}`);
          reject();
        }
      }, 0, this);
    });
  }
}
