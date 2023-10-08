import {
  DefaultOptons,
  Options,
  TrackerConfig,
  reportTrackerData,
} from "../types/core";
import { createHistoryEvent } from "../utils/pageViewTrac";

const MouseEventList: string[] = [
  "click",
  "dblclick",
  "contextmenu",
  "mousedown",
  "mouseup",
  "mouseenter",
  "mouseout",
  "mouseover",
];

export class Tracker {
  public userOpt: Options;
  private version: string | undefined;

  public constructor(options: Options) {
    this.userOpt = Object.assign(this.initDef(), options);
    this.installInnerTrack();
  }

  // configuring default params
  private initDef(): DefaultOptons {
    this.version = TrackerConfig.version;

    // override replaceState and pushState method.
    // from now on, we can use addEventListener to listen to events.
    window.history["replaceState"] = createHistoryEvent("replaceState");
    window.history["pushState"] = createHistoryEvent("pushState");

    return <DefaultOptons>{
      sdkVersion: this.version,
      historyTracker: false,
      hashTracker: false,
      domTracker: false,
      jsError: false,
    };
  }

  /**
   * configuring user ID
   * @param uuid user id
   */
  public setUserId<T extends DefaultOptons["uuid"]>(uuid: T) {
    this.userOpt.uuid = uuid;
  }

  /**
   * user coustom field data
   * @param extra field data
   */
  public setExtra<T extends DefaultOptons["extra"]>(extra: T) {
    this.userOpt.extra = extra;
  }

  /**
   * user reporting
   * @param data user coustom data
   */
  public sendTracker<T extends reportTrackerData>(data: T) {
    this.reportTracker(data);
  }

  /**
   * event catcher: Automatic reporting
   * @param MouseEventList mouse events
   * @param targetKey event type identifier
   * @param data
   */
  private captureEvents<T>(
    MouseEventList: string[],
    targetKey: string,
    data?: T
  ) {
    MouseEventList.forEach((event) => {
      window.addEventListener(
        event,
        () => {
          this.reportTracker({ PageError: { event, targetKey, data } });
        },
        false
      );
    });
  }

  private installInnerTrack() {
    if (this.userOpt.historyTracker) {
      this.captureEvents(["pushState"], "history-pv");
      this.captureEvents(["replaceState"], "history-pv");
      this.captureEvents(["popstate"], "history-pv");
    }
    if (this.userOpt.hashTracker) {
      this.captureEvents(["hashchange"], "hash-pv");
    }
    if (this.userOpt.domTracker) {
      this.targetKeyReport();
    }
    if (this.userOpt.jsError) {
      this.jsError();
    }
  }

  private targetKeyReport() {
    MouseEventList.forEach((event) => {
      window.addEventListener(
        event,
        (e) => {
          const target = e.target as HTMLElement;
          const targetValue = target.getAttribute("target-key");
          if (targetValue) {
            this.sendTracker({
              MouseEventErr: {
                targetKey: targetValue,
                event,
              },
            });
          }
        },
        false
      );
    });
  }

  private jsError() {
    this.errorEvent();
    this.promiseReject();
  }

  private errorEvent() {
    window.addEventListener("error", (e) => {
      this.sendTracker({
        JsErr: {
          targetKey: "message",
          event: "error",
          err_msg: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
        },
      });
    });
  }

  private promiseReject() {
    window.addEventListener("unhandledrejection", (event) => {
      event.promise.catch((error) => {
        this.sendTracker({
          PromiseErr: {
            targetKey: "reject",
            event: "promise",
            message: error,
          },
        });
      });
    });
  }

  private reportTracker<T>(data: T) {
    const params = Object.assign(
        this.userOpt,
        {
          time: new Date().getTime(),
        },
        data
      ),
      headers = {
        type: "application/x-www-form-urlencoded",
      },
      blob = new Blob([JSON.stringify(params)], headers);

    navigator.sendBeacon(this.userOpt.requestUrl, blob);
  }
}
