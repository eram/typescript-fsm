
import { Transition, StateMachine } from "./";

// tslint:disable:max-classes-per-file
// tslint:disable:no-console

// --- test file for ts-state-machine ---


enum States { closed, opened, broken };
enum Events { open, close, break };

class Trans2 extends Transition<States, Events> {

    toString(): string {
        return Events[this.fromState as States] + "|" + Events[this.event as Events] 
                + "|" + this.cb.name + "|" + States[this.toState as States];
    }

};



class Door {

    private fsm: StateMachine<States, Events>;
    private resolveCode: number;

    // ctor

    constructor() {

        const trans: Trans2[] = [
            /*          fromState       event           callback        toState     */
            new Trans2(States.closed, Events.open, this.onOpen, States.opened),
            new Trans2(States.opened, Events.close, this.onClose, States.closed),
            new Trans2(States.opened, Events.break, this.onBreak, States.broken),
            new Trans2(States.closed, Events.break, this.onBreak, States.broken)
        ];

        this.fsm = new StateMachine<States, Events>(States.closed, trans, this.hookAfterChange, this.hookOnFail);
        this.setResolveCode();
    }

    // public methods

    open(): boolean { return this.fsm.go(Events.open, this.resolveCode); }
    close(): boolean { return this.fsm.go(Events.close, this.resolveCode); }
    break(): boolean { return this.fsm.go(Events.break, this.resolveCode); }

    isBroken(): boolean { return this.fsm.isFinal(); }
    isOpen(): boolean { return this.fsm.getState() === States.opened; }
    setResolveCode(code = 0): void { this.resolveCode = code; }

    // privates methods

    private hookAfterChange(trans: Trans2): void {
        console.log("hookAfterChange:" + trans);
    }

    private hookOnFail(trans: Trans2, res: number): void {
        console.log("hookOnFail:" + trans + " res:" + res);
    }

    // transition callbacks
    
    private onOpen(...args: any[]): Promise<number> {

        console.log("onOpen...");
        const resolveCode = args[0][0] as number;
        const p = new Promise<number>((resolve, reject) => {

            setTimeout(() => {
                resolve(resolveCode);
            }, 200);

        });

        return p;
    }

    private onClose(...args: any[]): Promise<number> {

        console.log("onClose...");
        const resolveCode = args[0][0] as number;
        const p = new Promise<number>((resolve, reject) => {

            setTimeout(() => {
                resolve(resolveCode);
            }, 200);

        });

        return p;
    }

    private onBreak(...args: any[]): Promise<number> {

        console.log("onBreak...");
        const resolveCode = args[0][0] as number;
        const p = new Promise<number>((resolve, reject) => {

            setTimeout(() => {
                resolve(resolveCode);
            }, 200);

        });

        return p;
    }


}


// --- tests ---

function test(tstIdx = 0): void {

    const tests = [
        [
            "test opening a closed door", 0, () => {
                console.assert(false === door.isBroken());
                console.assert(false === door.close());
                console.assert(true === door.open());
            }
        ],

        [
            "test a failed event", 1000, () => {
                console.assert(true === door.isOpen());
                console.assert(false === door.open());

                door.setResolveCode(1);
                console.assert(true === door.close());
            }
        ],

        [
            "test closing an open door", 1000, () => {
                console.assert(true === door.isOpen());
                console.assert(false === door.open());

                door.setResolveCode(0);
                console.assert(true === door.close());
            }
        ],
        [
            "test breaking a door", 1000, () => {
                console.assert(false === door.isOpen());
                console.assert(false === door.close());
                console.assert(false === door.isBroken());
                console.assert(true === door.break());
            }
        ],
        [
            "test validate state", 1000, () => {
                console.assert(false === door.isOpen());
                console.assert(false === door.close());
                console.assert(true === door.isBroken());
                console.assert(false === door.break());
            }
        ],
        [
            "test done", 1000, () => {
                console.log("exiting...");
                process.exit(0);
            }
        ]

    ]


    if (tstIdx >= tests.length) {
        return;
    }

    const a = tests[tstIdx];

    const name = a[0] as string;
    const timeout = a[1] as number;
    const f = a[2] as () => void

    setTimeout(() => {

        console.log(name + " (" + timeout + ")");
        f();
        test(++tstIdx);

    }, timeout);
}



// --- main ---

console.log("main door...")
// debugger;

const door = new Door();
test();
