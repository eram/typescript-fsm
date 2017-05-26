
TS State Machine (TS-FSM)
==========================

TS-FSM is a strongly typed finite state machine for TypeScript that is using Promises for async operations. Finite state machines are useful for modeling complicated flows and keeping track of state.

Features:
----------
- TypeScript native (ES6)
- Only 1 KB (minified) and zero dependencies !!!
- Promises are used for async transition completion
- Generics for states and events types
- Simple tabular state machine defnition
- Hooks after state change and on error
- Use on server or NodeJs or client (!IE)

Installation:
----------
Take the code. I have not had the time to wrap it around with NPM etc. These are the general steps to get the test runing:
```script
# npm install -g typescript tslint typings
# git clone https://github.com/eram/ts-fsm.git
# cd ts-fsm && npm install
# npm run test
```
Files:
```script
transition.ts - holds a base transformation class with generics.
state-machine.ts - holds a base state-machine class with generics.
test.ts - usage example and a bunch of tests (not using any test suite!). 
index.ts - the startard library enty point.
```

Basic Example:
--------------
I'm modeling a "door" here. One can open the door, close it or break it. Once broken it reaches a final state. It takes 200ms to open, close or break the door.

```typescript

// these are the states and events. 
enum States { closed, opened, broken };
enum Events { open, close, break };

// this is the state machine - an array of transitions
const trans: Transition<States, Events>[] = [
   //          fromState      event         callback    toState
   new Transition( States.closed, Events.open,  onOpen, 	States.opened   ),
   new Transition( States.opened, Events.close, onClose, 	States.closed   ),
   new Transition( States.opened, Events.break, onBreak, 	States.broken   ),
   new Transition( States.closed, Events.break, onBreak, 	States.broken   )
];

// initialize the state machine
let door = new StateMachine<States, Events>(
   States.closed,   // initial state
   trans,           // array of transitions 
   hookAfterChange, // (trans: Transition<STATE, EVENT>) => void,
   hookOnFail       // (trans: Transition<STATE, EVENT>, res: number) => void
);


// the actions are async and return a promise:
function onOpen(...args: any[]): Promise<number> {

   console.log("onOpen...");
   const p = new Promise<number>((resolve, reject) => {

   // do something async and resolve the pronise when done
   setTimeout(() => {
      resolve(0);		// 0 for success - will move to next state
   }, 200);

   return p;
}

// onClose() and onBreak() functions are very similar to onOpen().

// here are the hook callbacks - these are synchronous
function hookAfterChange(trans: Trans2): void {
   console.log("transition successful:" + trans);
}

function hookOnFail(trans: Trans2, res: number): void {
   console.log("transition failed:" + trans + " res:" + res);
}

// we are ready for action:

door.getState() ;           // === States.closed
door.can(States.open) ;     // === true

door.go(States.open);       // start an async open 
           // - will call onOpen() immediately
           // - will call hookAfterChange() when promise is resolved

// ...200ms later:
door.getSate() ;            // === States.opened
door.isFinal()	;           // === false. this becomes true after you break the door.

```
Beautiful!
Comments and suggestions are welcome.

