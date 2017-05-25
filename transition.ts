

export class Transition<STATE, EVENT> {
    constructor(
        public fromState: STATE,
        public event: EVENT,
        public cb: (...args: any[]) => Promise<number>,
        public toState: STATE
    ) { }

    toString(): string {
        return this.fromState.toString() + "|" + this.event.toString() + "|" + this.cb.name + "|" + this.toState.toString();
    }
}
