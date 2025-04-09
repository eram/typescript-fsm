/* eslint-disable @typescript-eslint/no-floating-promises */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { t, StateMachine } from "../stateMachine";

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

export class StringyDoor extends StateMachine<States, Events> {
  private readonly _id = `Door${(Math.floor(Math.random() * 10000))}`;
  private readonly _key: number;

  constructor(key = 0, init = States.closed) {
    super(init);
    this._key = key;

    const s = States;
    const e = Events;

    this.addTransitions([
      t(s.closed, e.open, s.opening),
      t(s.opening, e.openComplete, s.opened),
      t(s.opened, e.close, s.closing),
      t(s.closing, e.closeComplete, s.closed),
      t(s.opened, e.break, s.breaking),
      t(s.closed, e.break, s.breaking),
      t(s.closed, e.lock, s.locking),
      t(s.locking, e.lockComplete, s.locked),
      t(s.locked, e.unlock, s.unlocking ),
      t(s.unlocking, e.unlockComplete, s.closed),
      t(s.unlocking, e.unlockFailed, s.locked),
      t(s.breaking, e.breakComplete, s.broken),
    ]);
  }
}

describe("StateMachine#toMermaid()", () => {
  const door = new StringyDoor();

  test("generate state diagram", async () => {
    const mmd = door.toMermaid();
    const lines = mmd.split("\n");

    assert.equal(lines[0], "stateDiagram-v2");
    assert.equal(lines[1], "  [*] --> closed");
    assert.equal(lines[2], "  closed --> opening: open");
    assert.equal(lines[3], "  opening --> opened: openComplete");
    assert.equal(lines[4], "  opened --> closing: close");
    assert.equal(lines[5], "  closing --> closed: closeComplete");
    assert.equal(lines[6], "  opened --> breaking: break");
    assert.equal(lines[7], "  closed --> breaking: break");
    assert.equal(lines[8], "  closed --> locking: lock");
    assert.equal(lines[9], "  locking --> locked: lockComplete");
    assert.equal(lines[10], "  locked --> unlocking: unlock");
    assert.equal(lines[11], "  unlocking --> closed: unlockComplete");
    assert.equal(lines[12], "  unlocking --> locked: unlockFailed");
    assert.equal(lines[13], "  breaking --> broken: breakComplete");
    assert.equal(lines[14], "  broken --> [*]");
  });

  test("generate state diagram with title", async () => {
    const mmd = door.toMermaid("The Door Machine");
    const lines = mmd.split("\n");

    assert.equal(lines[0], "---");
    assert.equal(lines[1], "title: The Door Machine");
    assert.equal(lines[2], "---");
  });
});