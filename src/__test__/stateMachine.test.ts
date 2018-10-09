import { tFrom, StateMachine } from "../";

enum States { closing = 0, closed, opening, open, breaking, broken }
enum Events { open = 100, openComplete, close, closeComplete, break, breakComplete }

class Door extends StateMachine<States, Events> {

    private id = `Door${(Math.floor(Math.random() * 10000))}`;

    // ctor
    constructor(init: States = States.closed) {

        super(init);

        this.addTransitions([
            /*   fromState       event           toState         callback */
            tFrom(States.closed, Events.open, States.opening, this.onOpen.bind(this)),
            tFrom(States.opening, Events.openComplete, States.open, this.justLog.bind(this)),
            tFrom(States.open, Events.close, States.closing, this.onClose.bind(this)),
            tFrom(States.closing, Events.closeComplete, States.closed, this.justLog.bind(this)),
            tFrom(States.open, Events.break, States.breaking, this.onBreak.bind(this)),
            tFrom(States.breaking, Events.breakComplete, States.broken),
            tFrom(States.closed, Events.break, States.breaking, this.onBreak.bind(this)),
            tFrom(States.breaking, Events.breakComplete, States.broken),
        ]);
    }

    // public methods

    open() { return this.dispatch(Events.open); }
    close() { return this.dispatch(Events.close); }
    break() { return this.dispatch(Events.break); }

    isBroken(): boolean { return this.isFinal(); }
    isOpen(): boolean { return this.getState() === States.open; }

    // transition callbacks
    private onOpen(): Promise<void> {

        console.log(`${this.id} onOpen...`);
        return this.dispatch(Events.openComplete);
    }

    private onClose(): Promise<void> {

        console.log(`${this.id} onClose...`);
        return this.dispatch(Events.closeComplete);
    }

    private onBreak(): Promise<void> {

        console.log(`${this.id} onBreak...`);
        return this.dispatch(Events.breakComplete);
    }

    private justLog(): void {
        console.log(`${this.id} ${States[this.getState()]}`);
    }
}


function sleep(timeout: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
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
            expect("should never get here").toBeFalsy();
        }).catch(() => {
            // we are good.
            done();
        });
    });

    test("test closing an open door", async () => {
        const door = new Door(States.open);
        expect(door.isOpen()).toBeTruthy();

        door.close();
        await sleep(200);
        expect(door.isOpen()).toBeFalsy();
    });

    test("test breaking a door", (done) => {
        const door = new Door();
        expect(door.isBroken()).toBeFalsy();

        door.break().then(() => {
            expect(door.isBroken()).toBeTruthy();
            expect(door.isOpen()).toBeFalsy();
            done();
        });
    });

    test("broken door cannot be opened or closed", (done) => {
        const door = new Door(States.broken);
        expect(door.isBroken()).toBeTruthy();

        door.open().then(() => {
            expect("should never get here").toBeFalsy();
        }).catch(() => {
            // we are good.
        });

        door.close().then(() => {
            expect("should never get here").toBeFalsy();
        }).catch(() => {
            // we are good.
            done();
        });
    });

    test("should throw on intermediate state", (done) => {
        const door = new Door(States.open);
        expect(door.isOpen()).toBeTruthy();

        /* dont await */
        door.close();
        expect(door.isOpen()).toBeTruthy();
        door.break().then(() => {
            expect("should never get here").toBeFalsy();
        }).catch(() => {
            // we are good.
            done();
        });
    });
});

