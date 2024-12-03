import { t, StateMachine, Callback } from "../stateMachine";

export enum States {
  closing = "closing",
  closed = "closed",
  opening = "opening",
  opened = "opened",
  breaking = "breaking",
  broken = "broken",
  locking = "locking",
  locked = "locked",
  unlocking = "unlocking",
}

export enum Events {
  open = "open",
  openComplete = "openComplete",
  close = "close",
  closeComplete = "closeComplete",
  break = "break",
  breakComplete = "breakComplete",
  lock = "lock",
  lockComplete = "lockComplete",
  unlock = "unlock",
  unlockComplete = "unlockComplete",
  unlockFailed = "unlockFailed",
}

interface ICallbacks extends Record<Events, Callback> {
  [Events.unlock]: (key: number) => void;
}

export class Door extends StateMachine<States, Events, ICallbacks> {
  private readonly _id = `Door${(Math.floor(Math.random() * 10000))}`;
  private readonly _key: number;

  constructor(key = 0, init = States.closed) {
    super(init);
    this._key = key;

    const s = States;
    const e = Events;

    /* eslint-disable no-multi-spaces */
    this.addTransitions([
      //    fromState     event              toState      callback
      t(s.closed,     e.open,           s.opening,    this._onOpen),
      t(s.opening,    e.openComplete,   s.opened,     this._justLog),
      t(s.opened,     e.close,          s.closing,    this._onClose),
      t(s.closing,    e.closeComplete,  s.closed,     this._justLog),
      t(s.opened,     e.break,          s.breaking,   this._onBreak),
      t(s.closed,     e.break,          s.breaking,   this._onBreak),
      t(s.closed,     e.lock,           s.locking,    this._onLock),
      t(s.locking,    e.lockComplete,   s.locked,     this._justLog),
      t(s.locked,     e.unlock,         s.unlocking,  this._onUnlock),
      t(s.unlocking,  e.unlockComplete, s.closed,     this._justLog),
      t(s.unlocking,  e.unlockFailed,   s.locked,     this._justLog),
      t(s.breaking,   e.breakComplete,  s.broken),
    ]);
    /* eslint-enable no-multi-spaces */
  }

  // public methods
  async open() { return this.dispatch(Events.open); }

  async close() { return this.dispatch(Events.close); }

  async break() { return this.dispatch(Events.break); }

  async lock() { return this.dispatch(Events.lock); }

  async unlock(key: number) { return this.dispatch(Events.unlock, key); }

  isBroken(): boolean { return this.isFinal(); }

  isOpen(): boolean { return this.getState() === States.opened; }

  isLocked(): boolean { return this.getState() === States.locked; }

  // transition callbacks
  private async _onOpen() {
    this.logger.log(`${this._id} onOpen...`);
    return this.dispatch(Events.openComplete);
  }

  private async _onClose() {
    this.logger.log(`${this._id} onClose...`);
    return this.dispatch(Events.closeComplete);
  }

  private async _onBreak() {
    this.logger.log(`${this._id} onBreak...`);
    return this.dispatch(Events.breakComplete);
  }

  private async _onLock() {
    this.logger.log(`${this._id} onLock...`);
    return this.dispatch(Events.lockComplete);
  }

  private async _onUnlock(key: number) {
    this.logger.log(`${this._id} onUnlock with key=${key}...`);
    if (key === this._key) {
      return this.dispatch(Events.unlockComplete);
    }
    await this.dispatch(Events.unlockFailed);
    throw new Error(`${key} failed to unlock ${this._id}`);
  }

  // sync callback
  private _justLog() {
    console.log(`${this._id} ${States[this.getState()]}`);
  }
}
