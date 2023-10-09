'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

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

/// <reference path="../types/global.d.ts"/>
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
        this.baseError();
        this.promiseReject();
        this.ajaxError();
        this.fetchError();
    }
    ajaxError() {
        const _send = window.XMLHttpRequest.prototype.send;
        const _this = this;
        window.XMLHttpRequest.prototype.send = function (...args) {
            this.addEventListener("loadend", (e) => {
                if (this.status >= 200 && this.status < 400)
                    return;
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
    fetchError() {
        const _fetch = fetch, _this = this;
        // @ts-ignore
        fetch = function (...args) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield _fetch.apply(_this, args);
                if (!res.ok) {
                    _this.sendTracker({
                        FetchError: {
                            targetKey: "reject",
                            event: "fetch",
                            status: res.status,
                            statusText: res.statusText,
                            url: res.url,
                        },
                    });
                }
                return res;
            });
        };
    }
    baseError() {
        window.addEventListener("error", (e) => {
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
                if ((e.target instanceof HTMLImageElement ||
                    e.target instanceof HTMLScriptElement) &&
                    e.target.src) {
                    const tar = e.target.outerHTML;
                    this.sendTracker({
                        ResourceLoadingErr: {
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
                        InvalidLinkErr: {
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
                        message: error.toString(),
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
