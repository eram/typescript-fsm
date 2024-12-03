/* eslint-disable sonarjs/no-duplicate-string */
import { Door } from "./DoorMachine";

describe("StateMachine#toMermaid()", () => {
  const door = new Door();

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
    expect(lines[3]).toBe("stateDiagram-v2");
    expect(lines[4]).toBe("  [*] --> closed");
    expect(lines[5]).toBe("  closed --> opening: open");
    expect(lines[6]).toBe("  opening --> opened: openComplete");
    expect(lines[7]).toBe("  opened --> closing: close");
    expect(lines[8]).toBe("  closing --> closed: closeComplete");
    expect(lines[9]).toBe("  opened --> breaking: break");
    expect(lines[10]).toBe("  closed --> breaking: break");
    expect(lines[11]).toBe("  closed --> locking: lock");
    expect(lines[12]).toBe("  locking --> locked: lockComplete");
    expect(lines[13]).toBe("  locked --> unlocking: unlock");
    expect(lines[14]).toBe("  unlocking --> closed: unlockComplete");
    expect(lines[15]).toBe("  unlocking --> locked: unlockFailed");
    expect(lines[16]).toBe("  breaking --> broken: breakComplete");
    expect(lines[17]).toBe("  broken --> [*]");
  });
});
