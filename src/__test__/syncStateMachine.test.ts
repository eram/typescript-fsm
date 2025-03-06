import { t, SyncStateMachine, SyncCallback } from "../stateMachine";

enum States { closing = 0, closed, opening, opened, breaking, broken, locking, locked, unlocking }
enum Events {
  open = 100, openComplete,
  close, closeComplete,
  break, breakComplete,
  lock, lockComplete,
  unlock, unlockComplete, unlockFailed,
}
interface ICallbacks extends Record<Events, SyncCallback> {
  [Events.unlock]: (key: number) => void;
}

class Door extends SyncStateMachine<States, Events, ICallbacks> {

  private readonly _id = `Door${(Math.floor(Math.random() * 10000))}`;
  private readonly _key: number;

  // ctor
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
      t(s.breaking,   e.breakComplete,  s.broken),
      t(s.closed,     e.break,          s.breaking,   this._onBreak),
      t(s.breaking,   e.breakComplete,  s.broken),
      t(s.closed,     e.lock,           s.locking,    this._onLock),
      t(s.locking,    e.lockComplete,   s.locked,     this._justLog),
      t(s.locked,     e.unlock,         s.unlocking,  this._onUnlock),
      t(s.unlocking,  e.unlockComplete, s.closed,     this._justLog),
      t(s.unlocking,  e.unlockFailed,   s.locked,     this._justLog),
    ]);
    /* eslint-enable no-multi-spaces */
  }

  // public methods
  open() { this.dispatch(Events.open); }

  close() { this.dispatch(Events.close); }

  break() { this.dispatch(Events.break); }

  lock() { this.dispatch(Events.lock); }

  unlock(key: number) { this.dispatch(Events.unlock, key); }

  isBroken(): boolean { return this.isFinal(); }

  isOpen(): boolean { return this.getState() === States.opened; }

  isLocked(): boolean { return this.getState() === States.locked; }

  // transition callbacks
  private _onOpen() {
    this.logger.log(`${this._id} onOpen...`);
    this.dispatch(Events.openComplete);
  }

  private _onClose() {
    this.logger.log(`${this._id} onClose...`);
    this.dispatch(Events.closeComplete);
  }

  private _onBreak() {
    this.logger.log(`${this._id} onBreak...`);
    this.dispatch(Events.breakComplete);
  }

  private _onLock() {
    this.logger.log(`${this._id} onLock...`);
    this.dispatch(Events.lockComplete);
  }

  private _onUnlock(key: number) {
    this.logger.log(`${this._id} onUnlock with key=${key}...`);
    if (key === this._key) {
      this.dispatch(Events.unlockComplete);
    } else {
      this.dispatch(Events.unlockFailed);
      throw new Error(`${key} failed to unlock ${this._id}`);
    }
  }

  // sync callback
  private _justLog() {
    console.log(`${this._id} ${States[this.getState()]}`);
  }
}


describe("syncStateMachine tests", () => {

  test("test opening a closed door", () => {
    const door = new Door();

    expect(door.isOpen()).toBeFalsy();
    expect(door.isBroken()).toBeFalsy();
    expect(door.can(Events.open)).toBeTruthy();
    expect(door.getNextState(Events.open)).toEqual(States.opening);

    door.open();
    expect(door.isOpen()).toBeTruthy();
  });

  test("test a failed event", (done) => {
    const door = new Door(undefined, States.opened);
    expect(door.can(Events.open)).toBeFalsy();

    expect(door.getNextState(Events.open)).toBeUndefined();

    try {
      door.open();
      expect("should never get here 1").toBeFalsy();
    } catch (e) {
      // we are good.
      done();
    }
  });

  test("test closing an open door", () => {
    const door = new Door(undefined, States.opened);
    expect(door.isOpen()).toBeTruthy();

    door.close();
    expect(door.isOpen()).toBeFalsy();
  });

  test("test breaking a door", () => {
    const door = new Door();
    expect(door.isBroken()).toBeFalsy();

    door.break();
    expect(door.isBroken()).toBeTruthy();
    expect(door.isOpen()).toBeFalsy();
  });

  test("broken door cannot be opened or closed", () => {
    const door = new Door(undefined, States.broken);
    expect(door.isBroken()).toBeTruthy();

    expect(() => door.open()).toThrow(`No transition: from ${States.broken} event ${Events.open}`);
  });

  test("should throw if callback throws", () => {
    const door = new Door(undefined, States.opened);
    let called = false;
    const errorToThrow = new Error("bad");

    door.addTransitions([
      t(States.opened, Events.open, States.opening, () => { called = true; throw errorToThrow; }),
    ]);

    expect(door.isOpen()).toBeTruthy();
    expect(() => door.open()).toThrow(errorToThrow);
    expect(called).toBeTruthy();
  });

  test("should unlock with correct key", () => {
    const key = 12345;
    const door = new Door(key, States.locked);
    door.unlock(key);
    expect(door.isLocked()).toBeFalsy();
  });

  test("should not unlock with incorrect key", () => {
    const key = 12345;
    const door = new Door(key, States.locked);

    try {
      door.unlock(key + 3);
      expect("should never get here 1").toBeFalsy();
    } catch {
      expect(door.isLocked()).toBeTruthy();
    }
  });
});
