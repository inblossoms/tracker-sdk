(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Tracker = {}));
})(this, (function (exports) { 'use strict';

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
              window.addEventListener(event, () => {
                  this.reportTracker({ PageError: { event, targetKey, data } });
              }, false);
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
              window.addEventListener(event, (e) => {
                  const target = e.target;
                  const targetValue = target.getAttribute("target-key");
                  if (targetValue) {
                      this.sendTracker({
                          MouseEventErr: {
                              targetKey: targetValue,
                              event,
                          },
                      });
                  }
              }, false);
          });
      }
      jsError() {
          this.errorEvent();
          this.promiseReject();
          // this.ajaxError();
          // this.fetchError();
      }
      //   private ajaxError() {
      //     const _send = window.XMLHttpRequest.prototype.send;
      //     window.XMLHttpRequest.prototype.send = function (...args) {
      //       this.addEventListener("loadend", (e) => {
      //         this.sendTracker({
      //           PromiseErr: {
      //             targetKey: "reject",
      //             event: "ajax",
      //             message: e,
      //           },
      //         });
      //       });
      //       _send.apply(this, args);
      //     };
      //   }
      //   private fetchError() {
      //     const _fetch = fetch,
      //       _this = this;
      //     fetch = function (
      //       ...args: [input: RequestInfo | URL, init?: RequestInit | undefined]
      //     ) {
      //       return _fetch.apply(_this, args).then((res) => {
      //         if (res.ok) return;
      //         _this.sendTracker({
      //           FetchError: {
      //             targetKey: "reject",
      //             event: "fetch",
      //             status: res.status,
      //             statusText: res.statusText,
      //             url: res.url,
      //           },
      //         });
      //       });
      //     };
      //   }
      errorEvent() {
          window.addEventListener("error", (e) => {
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
              const err = e.error;
              if (!err) {
                  if ((e.target instanceof HTMLImageElement ||
                      e.target instanceof HTMLScriptElement) &&
                      e.target.src) {
                      const tar = e.target.outerHTML;
                      this.sendTracker({
                          resourceLoading: {
                              targetKey: "src",
                              event: "invalidResourceg",
                              errTar: tar,
                              errInfo: e.target.src,
                          },
                      });
                  }
                  else if (e.target instanceof HTMLLinkElement && e.target.href) {
                      const tar = e.target.outerHTML;
                      this.sendTracker({
                          invalidLink: {
                              targetKey: "link",
                              event: "invalidLink",
                              errTar: tar,
                              errInfo: e.target.href,
                          },
                      });
                  }
              }
          }, true);
      }
      promiseReject() {
          window.addEventListener("unhandledrejection", (event) => {
              event.preventDefault();
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
      reportTracker(data) {
          const params = Object.assign(this.userOpt, {
              time: new Date().getTime(),
          }, data), headers = {
              type: "application/x-www-form-urlencoded",
          }, blob = new Blob([JSON.stringify(params)], headers);
          navigator.sendBeacon(this.userOpt.requestUrl, blob);
      }
  }

  exports.Tracker = Tracker;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
