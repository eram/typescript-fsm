import { t } from "../stateMachine";

import { Door, Events, States } from "./DoorMachine";

describe("stateMachine tests", () => {

  test("test opening a closed door", async () => {
    const door = new Door();

    expect(door.isOpen()).toBeFalsy();
    expect(door.isBroken()).toBeFalsy();
    expect(door.can(Events.open)).toBeTruthy();
    expect(door.getNextState(Events.open)).toEqual(States.opening);

    await door.open();
    expect(door.isOpen()).toBeTruthy();
  });

  test("test a failed event", (done) => {
    const door = new Door(undefined, States.opened);
    expect(door.can(Events.open)).toBeFalsy();

    expect(door.getNextState(Events.open)).toBeUndefined();

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

    await expect(door.open()).rejects.toThrowError(
      `No transition: from ${States.broken} event ${Events.open}`);
  });

  test("should throw on intermediate state", async () => {
    const door = new Door(undefined, States.opened);
    expect(door.isOpen()).toBeTruthy();

    const prms = /* don't await */ door.close();
    expect(door.isOpen()).toBeTruthy();
    await expect(door.break()).rejects.toThrowError(
      `No transition: from ${States.closing} event ${Events.break}`);
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
