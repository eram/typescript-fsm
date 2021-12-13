import { tFrom, StateMachine } from "../stateMachine";

enum States { closing = 0, closed, opening, open, breaking, broken }
enum Events { open = 100, openComplete, close, closeComplete, break, breakComplete }

class Door extends StateMachine<States, Events> {

  private readonly _id = `Door${(Math.floor(Math.random() * 10000))}`;

  // ctor
  constructor(init: States = States.closed) {

    super(init);

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
    ]);
    /* eslint-enable no-multi-spaces */
  }

  // public methods
  async open() { return this.dispatch(Events.open); }

  async close() { return this.dispatch(Events.close); }

  async break() { return this.dispatch(Events.break); }

  isBroken(): boolean { return this.isFinal(); }

  isOpen(): boolean { return this.getState() === States.open; }

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
    const door = new Door(States.open);
    expect(door.can(Events.open)).toBeFalsy();

    door.open().then(() => {
      expect("should never get here 1").toBeFalsy();
    }).catch(() => {
      // we are good.
      done();
    });
  });

  test("test closing an open door", async () => {
    const door = new Door(States.open);
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
    const door = new Door(States.broken);
    expect(door.isBroken()).toBeTruthy();

    await expect(door.open()).rejects.toEqual(undefined);
  });

  test("should throw on intermediate state", async () => {
    const door = new Door(States.open);
    expect(door.isOpen()).toBeTruthy();

    const prms = /* dont await */ door.close();
    expect(door.isOpen()).toBeTruthy();
    await expect(door.break()).rejects.toEqual(undefined);
    await prms;
  });
});
