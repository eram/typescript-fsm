/*
 * StateMachine.ts
 * TypeScript finite state machine class with async transformations using promises.
 */
export type SyncCallback = ((...args: unknown[]) => void);
export type Callback = ((...args: unknown[]) => Promise<void>) | SyncCallback;

export interface ITransition<STATE, EVENT, CALLBACK> {
  fromState: STATE;
  event: EVENT;
  toState: STATE;
  cb: CALLBACK;
}

export function t<STATE, EVENT, CALLBACK>(
  fromState: STATE, event: EVENT, toState: STATE,
  cb?: CALLBACK): ITransition<STATE, EVENT, CALLBACK> {
  return { fromState, event, toState, cb };
}

export type ILogger = Partial<typeof console> & { error(...data: unknown[]): void };

/**
 * StateMachine
 * TypeScript finite state machine class with async transformations.
 */
export class StateMachine<
  STATE extends string | number | symbol,
  EVENT extends string | number | symbol,
  CALLBACK extends Record<EVENT, Callback> = Record<EVENT, Callback>,
> {

  protected _current: STATE;

  // initialize the state-machine
  constructor(
    protected init: STATE,
    protected transitions: ITransition<STATE, EVENT, CALLBACK[EVENT]>[] = [],
    protected readonly logger: ILogger = console,
  ) {
    this._current = init;
  }

  addTransitions(transitions: ITransition<STATE, EVENT, CALLBACK[EVENT]>[]): void {

    // bind any unbound method
    transitions.forEach((_tran) => {
      const tran: ITransition<STATE, EVENT, CALLBACK[EVENT]> = Object.create(_tran);
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

  getNextState(event: EVENT): STATE | undefined {
    const transition = this.transitions.find((tran) => tran.fromState === this._current && tran.event === event);
    return transition?.toState;
  }

  isFinal(): boolean {
    // search for a transition that starts from current state.
    // if none is found it's a terminal state.
    return this.transitions.every((trans) => (trans.fromState !== this._current));
  }

  protected formatErr(fromState: STATE, event: EVENT) {
    return `No transition: from ${String(fromState)} event ${String(event)}`;
  }

  // post event async
  async dispatch<E extends EVENT>(event: E, ...args: unknown[]): Promise<void> {
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
                  p.then(resolve).catch(reject);
                } else {
                  resolve();
                }
              } catch (e) {
                this.logger.error("Exception in callback", e);
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
          const errorMessage = this.formatErr(me._current, event);
          this.logger.error(errorMessage);
          reject(new Error(errorMessage));
        }
      }, 0, this);
    });
  }

  /**
   * Generate a Mermaid StateDiagram of the current machine.
   */
  toMermaid( title?: string ) {
    const diagram: string[] = [];
    if (title) {
      diagram.push("---");
      diagram.push(`title: ${title}`);
      diagram.push("---");
    }
    diagram.push("stateDiagram-v2");
    diagram.push(`  [*] --> ${String(this.init)}`);

    this.transitions.forEach(({ event, fromState, toState }) => {
      const from = String(fromState);
      const to = String(toState);
      const evt = String(event);
      diagram.push(`  ${from} --> ${to}: ${evt}`);
    });

    // find terminal states
    const ts = new Set<STATE>();
    this.transitions.forEach(({ toState }) => ts.add(toState));
    this.transitions.forEach(({ fromState }) => ts.delete(fromState));
    ts.forEach((state) => diagram.push(`  ${String(state)} --> [*]`));

    return diagram.join("\n");
  }

}

/**
 * SyncStateMachine
 * TypeScript finite state machine class with sync transformations.
 */
export class SyncStateMachine<
  STATE extends string | number | symbol,
  EVENT extends string | number | symbol,
  CALLBACK extends Record<EVENT, SyncCallback> = Record<EVENT, SyncCallback>,
> extends StateMachine<STATE, EVENT, CALLBACK> {

  constructor(
    init: STATE,
    transitions: ITransition<STATE, EVENT, CALLBACK[EVENT]>[] = [],
    logger: ILogger = console,
  ) {
    super(init, transitions, logger);
  }

  override dispatch<E extends EVENT>(_event: E, ..._args: unknown[]): Promise<void> {
    throw new Error("SyncStateMachine does not support async dispatch.");
  }

  // post sync event
  // returns true if the event was handled, false otherwise
  syncDispatch<E extends EVENT>(event: E, ...args: unknown[]): boolean {
    // find transition
    const found = this.transitions.some((tran) => {
      if (tran.fromState === this._current && tran.event === event) {
        const current = this._current;
        this._current = tran.toState;
        if (tran.cb) {
          try {
            tran.cb(...args);
          } catch (e) {
            this._current = current; // revert to previous state
            this.logger.error("Exception in callback", e);
            throw e;
          }
          return true;
        }
        return false; // search for more transitions
      }
    });

    // no such transition
    if (!found) {
      const errorMessage = this.formatErr(this._current, event);
      this.logger.error(errorMessage);
    }

    return (!!found);
  }
}