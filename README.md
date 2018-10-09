
TypeScript State Machine (TS-FSM)
==========================

Finite state machines are useful for modeling complicated flows and keeping track of state. TS-FSM is a strongly typed finite state machine for TypeScript that is using promises for async operations. 
I'm using this state-machine as a simple replacement for redux in some ReactJs based apps. Check it out [here](https://github.com/eram/tfjs-stack-ts/blob/master/client/src/components/server-status-card/statusCardModel.ts)

Features:
----------
- TypeScript native (ES6)
- Only 1 KB (minified) and zero dependencies !!!
- Promises are used for async transition completion
- Generics for states and events types
- Simple tabular state machine defnition
- Hooks after state change and on error
- Use on server or NodeJs or client (!IE)
- 

Installation:
----------

```script
# git clone https://github.com/eram/ts-fsm.git ts-fsm
# cd ts-fsm
# npm install
# npm test
```
Basic Example:
--------------
I'm modeling a "door" here. One can open the door, close it or break it. Each action is done asych: when you open it goes into opening state and the resolved to open state etc. Once broken it reaches a final state.
Note that the same code can be run in Javascript, just remove the generics.

```typescript

// these are the states and events for the door
enum States { closing = 0, closed, opening, open, breaking, broken }
enum Events { open = 100, openComplete, close, closeComplete, break, breakComplete }

// lets define the transitions that will govern the state-machine
const transitions = [
    /*      fromState       event                   toState             callback */
    tFrom(States.closed,    Events.open,            States.opening,     onOpen),
    tFrom(States.opening,   Events.openComplete,    States.open,        justLog),
    tFrom(States.open,      Events.close,           States.closing,     onClose),
    tFrom(States.closing,   Events.closeComplete,   States.closed,      justLog),
    tFrom(States.open,      Events.break,           States.breaking,    onBreak),
    tFrom(States.closed,    Events.break,           States.breaking,    onBreak),
    tFrom(States.breaking,  Events.breakComplete,   States.broken,      justLog),
];

// initialize the state machine
const door = new StateMachine<States, Events>(
   States.closed,   // initial state
   transitions,     // array of transitions 
);


// the actions are async and return a promise:
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

// synchronous callbck is also ok
function justLog(): void { 
    console.log(`${States[door.getState()]}`);
}

// we are ready for action - run a few state-machine steps...
new Promise(async (resolve) => {

    // open the door and wait for it to be open
    await door.dispatch(Events.open);
    door.getState(); // => States.open

    // check if the door can be closed
    door.can(Events.close); // => true

    // break the door async
    door.dispatch(Events.break).then(() => {
        // did we get to a finite state?
        door.isFinal(); // => true 
    });

    // door is now in breaking. It cannot be closed...
    try {
        await door.dispatch(Events.close);
        assert("should not get here!");
    } catch (e) {
        // we're good
    }

    // let the async break complete
    setTimeout(resolve, 100);
});

```

Beautiful!
Comments and suggestions are welcome.
