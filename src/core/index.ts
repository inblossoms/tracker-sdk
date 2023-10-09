/// <reference path="../types/global.d.ts"/>

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
    this.baseError();
    this.promiseReject();
    this.ajaxError();
    // this.fetchError();
  }

  private ajaxError() {
    const _send = window.XMLHttpRequest.prototype.send;
    const _this = this;
    window.XMLHttpRequest.prototype.send = function (...args) {
      this.addEventListener("loadend", (e) => {
        if (this.status >= 200 && this.status < 400) return;
        // 请求失败，处理错误数据

        _this.sendTracker({
          AjaxErr: {
            targetKey: "reject",
            event: "ajax",
            message: {
              status: this.status,
              statusText: this.statusText,
              responseURL: this.responseURL,
            },
          },
        });
      });
      _send.apply(this, args);
    };
  }

  //   private fetchError() {
  //     const _fetch = window.fetch,
  //       _this = this;

  //     window.fetch.bind(
  //       window,
  //       //   @ts-ignore
  //       async function (...args: [input: RequestInfo | URL]) {
  //         const res = await _fetch.apply(_this, args);
  //         if (!res.ok) {
  //           _this.sendTracker({
  //             FetchError: {
  //               targetKey: "reject",
  //               event: "fetch",
  //               status: res.status,
  //               statusText: res.statusText,
  //               url: res.url,
  //             },
  //           });
  //         }
  //         return res;
  //       }
  //     );
  //   }

  private baseError() {
    window.addEventListener(
      "error",
      (e) => {
        const errInfo = e.message;
        if (errInfo) {
          this.sendTracker({
            JsErr: {
              targetKey: "message",
              event: "JsError",
              err_msg: e.message,
              filename: e.filename,
              lineno: e.lineno,
              colno: e.colno,
            },
          });
        }
        if (!errInfo) {
          if (
            (e.target instanceof HTMLImageElement ||
              e.target instanceof HTMLScriptElement) &&
            e.target.src
          ) {
            const tar = e.target.outerHTML;

            this.sendTracker({
              ResourceLoadingErr: {
                targetKey: "src",
                event: "invalidResourceg",
                errTar: tar,
                errInfo: e.target.src,
              },
            });
          } else if (e.target instanceof HTMLLinkElement && e.target.href) {
            const tar = e.target.outerHTML;

            this.sendTracker({
              InvalidLinkErr: {
                targetKey: "link",
                event: "invalidLink",
                errTar: tar,
                errInfo: e.target.href,
              },
            });
          }
        }
      },
      true
    );
  }

  private promiseReject() {
    window.addEventListener("unhandledrejection", (event) => {
      event.preventDefault();
      event.promise.catch((error) => {
        this.sendTracker({
          PromiseErr: {
            targetKey: "reject",
            event: "promise",
            message: error.toString(),
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
