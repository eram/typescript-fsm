import { tFrom, StateMachine } from "../stateMachine";

enum States { closing = 0, closed, opening, open, breaking, broken, locking, locked, unlocking }
enum Events {
  open = 100, openComplete,
  close, closeComplete,
  break, breakComplete,
  lock, lockComplete,
  unlock, unlockComplete, unlockFailed,
}

class Door extends StateMachine<States, Events> {

  private readonly _id = `Door${(Math.floor(Math.random() * 10000))}`;
  private readonly _key: number;

  // ctor
  constructor(key: number = 0, init: States = States.closed) {

    super(init);
    this._key = key;

    const s = States;
    const e = Events;

    /* eslint-disable no-multi-spaces */
    this.addTransitions([
      //    fromState    event            toState      callback
      tFrom(s.closed,    e.open,          s.opening,   this._onOpen.bind(this)),
      tFrom(s.opening,   e.openComplete,  s.open,      this._justLog.bind(this)),
      tFrom(s.open,      e.close,         s.closing,   this._onClose.bind(this)),
      tFrom(s.closing,   e.closeComplete, s.closed,    this._justLog.bind(this)),
      tFrom(s.open,      e.break,         s.breaking,  this._onBreak.bind(this)),
      tFrom(s.breaking,  e.breakComplete, s.broken),
      tFrom(s.closed,    e.break,         s.breaking,  this._onBreak.bind(this)),
      tFrom(s.breaking,  e.breakComplete, s.broken),
      tFrom(s.closed, e.lock, s.locking, this._onLock.bind(this)),
      tFrom(s.locking, e.lockComplete, s.locked, this._justLog.bind(this)),
      tFrom(s.locked, e.unlock, s.unlocking, this._onUnlock.bind(this)),
      tFrom(s.unlocking, e.unlockComplete, s.closed, this._justLog.bind(this)),
      tFrom(s.unlocking, e.unlockFailed, s.locked, this._justLog.bind(this)),
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

  isOpen(): boolean { return this.getState() === States.open; }

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

  private async _justLog() {
    console.log(`${this._id} ${States[this.getState()]}`);
    return Promise.resolve();
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
    const door = new Door(undefined, States.open);
    expect(door.can(Events.open)).toBeFalsy();

    door.open().then(() => {
      expect("should never get here 1").toBeFalsy();
    }).catch(() => {
      // we are good.
      done();
    });
  });

  test("test closing an open door", async () => {
    const door = new Door(undefined, States.open);
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
    const door = new Door(undefined, States.open);
    expect(door.isOpen()).toBeTruthy();

    const prms = /* dont await */ door.close();
    expect(door.isOpen()).toBeTruthy();
    await expect(door.break()).rejects.toEqual(undefined);
    await prms;
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
