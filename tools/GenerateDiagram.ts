import { writeFileSync } from "node:fs";
import path from "node:path";

import { Door } from "../src/__test__/DoorMachine";

const door = new Door();
const filepath = path.join(process.cwd(), "door.mmd");

writeFileSync(filepath, door.toMermaid());

console.log(
  `Wrote to file \x1b[33m${filepath.replace(process.cwd(), ".")}\x1b[0m`,
);
