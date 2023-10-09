import { reportTrackerData } from "./core";

declare global {
  interface XMLHttpRequest {
    sendTracker<T extends reportTrackerData>(data: T): void;
  }
}

export {};
