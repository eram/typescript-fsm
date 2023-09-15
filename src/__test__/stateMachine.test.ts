import { t, StateMachine, Callback } from "../stateMachine";

enum States { closing = 0, closed, opening, opened, breaking, broken, locking, locked, unlocking }
enum Events {
  open = 100, openComplete,
  close, closeComplete,
  break, breakComplete,
  lock, lockComplete,
  unlock, unlockComplete, unlockFailed,
}
interface ICallbacks extends Record<Events, Callback> {
  [Events.unlock]: (key: number) => void;
}

class Door extends StateMachine<States, Events, ICallbacks> {

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
    console.log(`${this._id} onOpen...`);
    return this.dispatch(Events.openComplete);
  }

  private async _onClose() {
    console.log(`${this._id} onClose...`);
    return this.dispatch(Events.closeComplete);
  }

  private async _onBreak() {
    console.log(`${this._id} onBreak...`);
    return this.dispatch(Events.breakComplete);
  }

  private async _onLock() {
    console.log(`${this._id} onLock...`);
    return this.dispatch(Events.lockComplete);
  }

  private async _onUnlock(key: number) {
    console.log(`${this._id} onUnlock with key=${key}...`);
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


describe("stateMachine tests", () => {

  test("test opening a closed door", async () => {
    const door = new Door();

    expect(door.isOpen()).toBeFalsy();
    expect(door.isBroken()).toBeFalsy();
    expect(door.can(Events.open)).toBeTruthy();

    await door.open();
    expect(door.isOpen()).toBeTruthy();
  });

  test("test a failed event", (done) => {
    const door = new Door(undefined, States.opened);
    expect(door.can(Events.open)).toBeFalsy();

    door.open().then(() => {
      expect("should never get here 1").toBeFalsy();
    }).catch(() => {
      // we are good.
      done();
    });
  });

  test("test closing an open door", async () => {
    const door = new Door(undefined, States.opened);
    expect(door.isOpen()).toBeTruthy();

    await door.close();
    expect(door.isOpen()).toBeFalsy();
  });

  test("test breaking a door", async () => {
    const door = new Door();
    expect(door.isBroken()).toBeFalsy();

    await door.break();
    expect(door.isBroken()).toBeTruthy();
    expect(door.isOpen()).toBeFalsy();
  });

  test("broken door cannot be opened or closed", async () => {
    const door = new Door(undefined, States.broken);
    expect(door.isBroken()).toBeTruthy();

    await expect(door.open()).rejects.toEqual(undefined);
  });

  test("should throw on intermediate state", async () => {
    const door = new Door(undefined, States.opened);
    expect(door.isOpen()).toBeTruthy();

    const prms = /* don't await */ door.close();
    expect(door.isOpen()).toBeTruthy();
    await expect(door.break()).rejects.toEqual(undefined);
    await prms;
  });

  test("should throw if callback throws", async () => {
    const door = new Door(undefined, States.opened);
    let called = false;

    door.addTransitions([
      t(States.opened, Events.open, States.opening, () => { called = true; throw new Error("bad"); }),
    ]);

    expect(door.isOpen()).toBeTruthy();
    await expect(door.open()).rejects.toBeInstanceOf(Error);
    expect(called).toBeTruthy();
  });

  test("should unlock with correct key", async () => {
    const key = 12345;
    const door = new Door(key, States.locked);
    await door.unlock(key);
    expect(door.isLocked()).toBeFalsy();
  });

  test("should not unlock with incorrect key", async () => {
    const key = 12345;
    const door = new Door(key, States.locked);

    try {
      await door.unlock(key + 3);
      expect("should never get here 1").toBeFalsy();
    } catch {
      expect(door.isLocked()).toBeTruthy();
    }
  });
});
