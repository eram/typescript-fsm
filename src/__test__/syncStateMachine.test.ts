/* eslint-disable @typescript-eslint/no-floating-promises */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { t, SyncStateMachine } from "../stateMachine";

/***
 * SyncStateMachine
 */
describe("SyncStateMachine tests", () => {
  // Define the States and Events enums just for the sync tests
  enum States { CLOSED = 1, OPENED, BROKEN, LOCKED }
  enum Events { OPEN = 100, CLOSE, BREAK, LOCK, UNLOCK }

  class SyncDoor extends SyncStateMachine<States, Events> {
    private readonly _id = `SyncDoor${(Math.floor(Math.random() * 10000))}`;
    private readonly _key: number;
    private _callbackCalled = false;

    constructor(key = 0, init = States.CLOSED) {
      super(init);
      this._key = key;

      const s = States;
      const e = Events;

      /* eslint-disable no-multi-spaces */
      this.addTransitions([
        //    fromState     event              toState      callback
        t(s.CLOSED,     e.OPEN,           s.OPENED,     this.#onOpen),
        t(s.OPENED,     e.CLOSE,          s.CLOSED,     this.#onClose),
        t(s.OPENED,     e.BREAK,          s.BROKEN,     this.#onBreak),
        t(s.CLOSED,     e.BREAK,          s.BROKEN,     this.#onBreak),
        t(s.CLOSED,     e.LOCK,           s.LOCKED,     this.#onLock),
        t(s.LOCKED,     e.UNLOCK,         s.CLOSED,     this.#onUnlock),
        t(s.LOCKED,     e.BREAK,          s.BROKEN,     this.#onBreak),
      ]);
      /* eslint-enable no-multi-spaces */
    }

    // public methods
    open = () => this.syncDispatch(Events.OPEN);
    close = () => this.syncDispatch(Events.CLOSE);
    break = () => this.syncDispatch(Events.BREAK);
    lock = () => this.syncDispatch(Events.LOCK);
    unlock = (key: number) => this.syncDispatch(Events.UNLOCK, key);

    wasCallbackCalled(): boolean { return this._callbackCalled; }
    resetCallbackFlag(): void { this._callbackCalled = false; }

    isBroken(): boolean { return this.isFinal(); }
    isOpen(): boolean { return this.getState() === States.OPENED; }
    isLocked(): boolean { return this.getState() === States.LOCKED; }

    // transition callbacks
    #onOpen(): void {
      this._callbackCalled = true;
      this.logger.log(`${this._id} onOpen: now ${States[this.getState()]}`);
    }

    #onClose(): void {
      this._callbackCalled = true;
      this.logger.log(`${this._id} onClose: now ${States[this.getState()]}`);
    }

    #onBreak(): void {
      this._callbackCalled = true;
      this.logger.log(`${this._id} onBreak: now ${States[this.getState()]}`);
    }

    #onLock(): void {
      this._callbackCalled = true;
      this.logger.log(`${this._id} onLock: now ${States[this.getState()]}`);
    }

    #onUnlock(key: number): void {
      this._callbackCalled = true;
      this.logger.log(`${this._id} onUnlock with key=${key}...`);
      if (key !== this._key) {
        throw new Error(`${key} failed to unlock ${this._id}`);
      }
    }
  }

  // ---- TEST CASES ----

  test("should open a closed door synchronously", () => {
    const door = new SyncDoor();

    assert.ok(!door.isOpen());
    assert.ok(!door.isBroken());
    assert.ok(door.can(Events.OPEN));

    const result = door.open();
    assert.ok(result);
    assert.ok(door.isOpen());
    assert.ok(door.wasCallbackCalled());
  });

  test("should return false for invalid transitions", () => {
    const door = new SyncDoor(undefined, States.OPENED);
    assert.ok(!door.can(Events.OPEN));

    const result = door.open();
    assert.equal(result, false);
    assert.ok(door.isOpen()); // state remains unchanged
  });

  test("should break a door synchronously", () => {
    const door = new SyncDoor();
    assert.ok(!door.isBroken());

    const result = door.break();
    assert.ok(result);
    assert.ok(door.isBroken());
  });

  test("should throw on dispatch call", () => {
    const door = new SyncDoor();
    assert.throws(() => door.dispatch(Events.OPEN));
  });

  test("should unlock with correct key", () => {
    const key = 12345;
    const door = new SyncDoor(key, States.LOCKED);
    assert.ok(door.unlock(key));
    assert.ok(!door.isLocked());
  });

  test("should throw with incorrect key", () => {
    const key = 12345;
    const door = new SyncDoor(key, States.LOCKED);
    assert.ok(door.isLocked());
    assert.throws(() => door.unlock(key + 3));
    assert.ok(door.isLocked());
  });
});
