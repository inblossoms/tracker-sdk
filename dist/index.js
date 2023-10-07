(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? factory(exports)
    : typeof define === "function" && define.amd
    ? define(["exports"], factory)
    : ((global =
        typeof globalThis !== "undefined" ? globalThis : global || self),
      factory((global.tracker = {})));
})(this, function (exports) {
  "use strict";

  /**
   * @version sdk
   */
  var TrackerConfig;
  (function (TrackerConfig) {
    TrackerConfig["version"] = "1.0.0";
  })(TrackerConfig || (TrackerConfig = {}));

  /**
   * history API 构造类
   * @param type pushState | replaceState
   * @returns
   */
  const createHistoryEvent = (type) => {
    const origin = history[type];
    return function () {
      const res = origin.apply(this, arguments);
      // create custom event: pushState|replaceState
      const e = new Event(type);
      // dispatch event
      window.dispatchEvent(e);
      return res;
    };
  };
  // createHistoryEvent();
  //   记录用户页面访问量
  //   history 无法通过 popstate 监听, pushState replaceState

  const MouseEventList = [
    "click",
    "dblclick",
    "contextmenu",
    "mousedown",
    "mouseup",
    "mouseenter",
    "mouseout",
    "mouseover",
  ];
  class Tracker {
    constructor(options) {
      this.userOpt = Object.assign(this.initDef(), options);
      this.installInnerTrack();
    }
    // configuring default params
    initDef() {
      this.version = TrackerConfig.version;
      // override replaceState and pushState method.
      // from now on, we can use addEventListener to listen to events.
      window.history["replaceState"] = createHistoryEvent("replaceState");
      window.history["pushState"] = createHistoryEvent("pushState");
      return {
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
    setUserId(uuid) {
      this.userOpt.uuid = uuid;
    }
    /**
     * user coustom field data
     * @param extra field data
     */
    setExtra(extra) {
      this.userOpt.extra = extra;
    }
    /**
     * user reporting
     * @param data user coustom data
     */
    sendTracker(data) {
      this.reportTracker(data);
    }
    /**
     * event catcher: Automatic reporting
     * @param MouseEventList mouse events
     * @param targetKey event type identifier
     * @param data
     */
    captureEvents(MouseEventList, targetKey, data) {
      MouseEventList.forEach((event) => {
        window.addEventListener(
          event,
          () => {
            this.reportTracker({ event, targetKey, data });
          },
          false
        );
      });
    }
    installInnerTrack() {
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
    targetKeyReport() {
      MouseEventList.forEach((event) => {
        window.addEventListener(
          event,
          (e) => {
            const target = e.target;
            const targetValue = target.getAttribute("target-key");
            if (targetValue) {
              this.sendTracker({
                targetKey: targetValue,
                event,
              });
            }
          },
          false
        );
      });
    }
    jsError() {
      this.errorEvent();
      this.promiseReject();
    }
    errorEvent() {
      window.addEventListener("error", (e) => {
        this.sendTracker({
          targetKey: "message",
          event: "error",
          message: e.message,
        });
      });
    }
    promiseReject() {
      window.addEventListener("unhandledrejection", (event) => {
        event.promise.catch((error) => {
          this.sendTracker({
            targetKey: "reject",
            event: "promise",
            message: error,
          });
        });
      });
    }
    reportTracker(data) {
      const params = Object.assign(this.userOpt, data, {
          time: new Date().getTime(),
        }),
        headers = {
          type: "application/x-www-form-urlencoded",
        },
        blob = new Blob([JSON.stringify(params)], headers);
      navigator.sendBeacon(this.userOpt.requestUrl, blob);
    }
  }

  exports.Tracker = Tracker;

  Object.defineProperty(exports, "__esModule", { value: true });
});