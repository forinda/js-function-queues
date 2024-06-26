import { myQueue } from "./utils/function-manager";

export function debounce(func: Function, time_out = 1000) {
  let timer: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: any[]) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, time_out);
  };
}

// Synchronous functions
const syncFn1 = () => console.log("Sync Function 1");
const syncFn2 = () => {
  throw new Error("Some error");
  console.log("Sync Function 2");
};
const syncFn3 = () => console.log("Sync Function 3");

// Asynchronous functions

const asyncFn2 = () =>
  new Promise<void>((resolve) => {
    console.log("Async Function 2");
    setTimeout(resolve, 500);
  });

const asyncFn3 = () =>
  new Promise<void>((resolve) => {
    console.log("Async Function 3");
    setTimeout(resolve, 700);
  });
// const viewQueue = () => console.log({ QUEUE: myQueue });
const asyncFn1 = () =>
  new Promise<void>(() => {
    throw new Error("Some error");
  });
// Enqueue functions
myQueue.enqueue(syncFn1);
myQueue.enqueue(asyncFn1, { retry_times: 5 });
myQueue.enqueue(syncFn2, { retry_times: 7 });
myQueue.enqueue(asyncFn2);
myQueue.enqueue(syncFn3);
myQueue.enqueue(asyncFn3);
