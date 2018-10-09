import { tFrom, StateMachine } from "../";

enum States { closing = 0, closed, opening, open, breaking, broken }
enum Events { open = 100, openComplete, close, closeComplete, break, breakComplete }


const transitions = [
    /*      fromState       event                   toState             callback */
    tFrom(States.closed,    Events.open,            States.opening,     onOpen),
    tFrom(States.opening,   Events.openComplete,    States.open,        justLog),
    tFrom(States.open,      Events.close,           States.closing,     onClose),
    tFrom(States.closing,   Events.closeComplete,   States.closed,      justLog),
    tFrom(States.open,      Events.break,           States.breaking,    onBreak),
    tFrom(States.closed,    Events.break,           States.breaking,    onBreak),
    tFrom(States.breaking,  Events.breakComplete,   States.broken,      justLog),
]

const door = new StateMachine<States, Events>(States.closed, transitions);

// transition callbacks
function onOpen(): Promise<void> {

    console.log("onOpen...");
    return door.dispatch(Events.openComplete);
}

function onClose(): Promise<void> {

    console.log("onClose...");
    return door.dispatch(Events.closeComplete);
}

function onBreak(): Promise<void> {

    console.log("onBreak...");
    return door.dispatch(Events.breakComplete);
}

function justLog(): void {
    console.log(`${States[door.getState()]}`);
}


// tslint:disable:no-console
const assert = console.assert;

// run a few state machine steps...
new Promise(async (resolve) => {

    await door.dispatch(Events.open);
    assert(door.getState() === States.open);

    assert(door.can(Events.close));

    door.dispatch(Events.break).then(() => {
        assert(door.isFinal());
    });

    // cannot close a broken door....
    try {
        await door.dispatch(Events.close);
        assert("should not get here!");
    } catch (e) {
        // we're good
    }

    setTimeout(resolve, 100);
});
