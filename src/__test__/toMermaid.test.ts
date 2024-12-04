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

    expect(lines[0]).toBe("stateDiagram-v2");
    expect(lines[1]).toBe("  [*] --> closed");
    expect(lines[2]).toBe("  closed --> opening: open");
    expect(lines[3]).toBe("  opening --> opened: openComplete");
    expect(lines[4]).toBe("  opened --> closing: close");
    expect(lines[5]).toBe("  closing --> closed: closeComplete");
    expect(lines[6]).toBe("  opened --> breaking: break");
    expect(lines[7]).toBe("  closed --> breaking: break");
    expect(lines[8]).toBe("  closed --> locking: lock");
    expect(lines[9]).toBe("  locking --> locked: lockComplete");
    expect(lines[10]).toBe("  locked --> unlocking: unlock");
    expect(lines[11]).toBe("  unlocking --> closed: unlockComplete");
    expect(lines[12]).toBe("  unlocking --> locked: unlockFailed");
    expect(lines[13]).toBe("  breaking --> broken: breakComplete");
    expect(lines[14]).toBe("  broken --> [*]");
  });


  test("generate state diagram with title", async () => {
    const mmd = door.toMermaid("The Door Machine");
    const lines = mmd.split("\n");

    expect(lines[0]).toBe("---");
    expect(lines[1]).toBe("title: The Door Machine");
    expect(lines[2]).toBe("---");
  });
});