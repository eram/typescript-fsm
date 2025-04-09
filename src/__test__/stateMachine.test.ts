/* eslint-disable @typescript-eslint/no-floating-promises */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { t, StateMachine, type ILogger } from "../stateMachine";

describe("stateMachine tests", async () => {

  // testing Door state machine
  enum States { closing = 0, closed, opening, opened, breaking, broken, locking, locked, unlocking }
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
    constructor(key = 0, init = States.closed, logger?: ILogger) {

      super(init, [], logger);
      this._key = key;

      const s = States;
      const e = Events;

      /* eslint-disable no-multi-spaces */
      this.addTransitions([
        //    fromState     event              toState      callback
        t(s.closed,     e.open,             s.opening,    this.#onOpen),
        t(s.opening,    e.openComplete,     s.opened,     this.#justLog),
        t(s.opened,     e.close,            s.closing,    this.#onClose),
        t(s.closing,    e.closeComplete,    s.closed,     this.#justLog),
        t(s.opened,     e.break,            s.breaking,   this.#onBreak),
        t(s.breaking,   e.breakComplete,    s.broken),
        t(s.closed,     e.break,            s.breaking,   this.#onBreak),
        t(s.breaking,   e.breakComplete,    s.broken),
        t(s.closed,     e.lock,             s.locking,    this.#onLock),
        t(s.locking,    e.lockComplete,     s.locked,     this.#justLog),
        t(s.locked,     e.unlock,           s.unlocking,  this.#onUnlock),
        t(s.unlocking,  e.unlockComplete,   s.closed,     this.#justLog),
        t(s.unlocking,  e.unlockFailed,     s.locked,     this.#justLog),
      ]);
      /* eslint-enable no-multi-spaces */
    }

    // public methods
    open = async () => this.dispatch(Events.open);
    close = async () => this.dispatch(Events.close);
    break = async () => this.dispatch(Events.break);
    async lock() { return this.dispatch(Events.lock); }
    async unlock(key: number) { return this.dispatch(Events.unlock, key); }

    isBroken = () => this.isFinal();
    isOpen = () => (this.getState() === States.opened);
    isLocked = () => (this.getState() === States.locked);

    // transition callbacks
    async #onOpen() {
      this.logger.log(`${this._id} onOpen...`);
      return this.dispatch(Events.openComplete);
    }

    async #onClose() {
      this.logger.log(`${this._id} onClose...`);
      return this.dispatch(Events.closeComplete);
    }

    async #onBreak() {
      this.logger.log(`${this._id} onBreak...`);
      return this.dispatch(Events.breakComplete);
    }

    async #onLock() {
      this.logger.log(`${this._id} onLock...`);
      return this.dispatch(Events.lockComplete);
    }

    async #onUnlock(key: number) {
      this.logger.log(`${this._id} onUnlock with key=${key}...`);
      if (key === this._key) {
        return this.dispatch(Events.unlockComplete);
      }
      await this.dispatch(Events.unlockFailed);
      throw new Error(`${key} failed to unlock ${this._id}`);
    }

    // sync callback
    #justLog() {
      console.log(`${this._id} ${States[this.getState()]}`);
    }
  }

  // ---- TEST CASES ----

  test("should correctly report current state", async () => {
    const door = new Door(undefined, States.opened);
    assert.equal(door.getState(), States.opened);
    await door.close();
    assert.equal(door.getState(), States.closed);
  });

  test("should handle multiple transition registrations", () => {
    const door = new Door();
    // Add a new transition that wasn't in the constructor
    door.addTransitions([
      t(States.closed, Events.unlock, States.closed, () => { /* noop */ }),
    ]);
    assert.ok(door.can(Events.unlock));
  });

  test("test opening a closed door", async () => {
    const door = new Door();

    assert.ok(!door.isOpen());
    assert.ok(!door.isBroken());
    assert.ok(door.can(Events.open));
    assert.equal(door.getNextState(Events.open), States.opening);

    await door.open();
    assert.ok(door.isOpen());
  });

  test("test a failed event", async () => {
    const door = new Door(undefined, States.opened);
    assert.ok(!door.can(Events.open));
    assert.equal(door.getNextState(Events.open), undefined);

    await assert.rejects(door.open());
  });

  test("test closing an open door", async () => {
    const door = new Door(undefined, States.opened);
    assert.ok(door.isOpen());

    await door.close();
    assert.ok(!door.isOpen());
  });

  test("test breaking a door", async () => {
    const door = new Door();
    assert.ok(!door.isBroken());

    await door.break();
    assert.ok(door.isBroken());
    assert.ok(!door.isOpen());
  });

  test("broken door cannot be opened or closed", async () => {
    const door = new Door(undefined, States.broken);
    assert.ok(door.isBroken());

    await assert.rejects(door.open(), {
      message: `No transition: from ${States.broken} event ${Events.open}`,
    });
  });

  test("should throw on intermediate state", async () => {
    const door = new Door(undefined, States.opened);
    assert.ok(door.isOpen());

    const closePromise = door.close();
    assert.ok(door.isOpen());

    await assert.rejects(door.break(), {
      message: `No transition: from ${States.closing} event ${Events.break}`,
    });

    await closePromise;
  });

  test("should throw if callback throws", async () => {
    const door = new Door(undefined, States.opened);
    let called = false;

    door.addTransitions([
      t(States.opened, Events.open, States.opening, () => { called = true; throw new Error("bad"); }),
    ]);

    assert.ok(door.isOpen());

    await assert.rejects(door.open(), Error);

    assert.ok(called);
  });

  test("should unlock with correct key", async () => {
    const key = 12345;
    const door = new Door(key, States.locked);
    await door.unlock(key);
    assert.ok(!door.isLocked());
  });

  test("should not unlock with incorrect key", async () => {
    const key = 12345;
    const door = new Door(key, States.locked);

    await assert.rejects(door.unlock(key + 3));

    assert.ok(door.isLocked());
  });


  void test("should support custom loggers", async () => {
    let errorCalled = false;
    const mockLogger = {
      error: () => { errorCalled = true; },
      log: () => {},
    };

    const door = new Door(0, States.closed, mockLogger);

    await assert.rejects(door.dispatch(Events.unlock));

    assert.ok(errorCalled);
  });
});