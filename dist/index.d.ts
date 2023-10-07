/**
 * @uuid user Id
 * @requestUrl 数据上报地址
 * @historyTracker history上报
 * @hashTracker hash上报
 * @domTracker 事件上报（携带 Tracker-key）
 * @sdkVersion sdk版本
 * @extra User DIY 透传字段
 * @jsError js 和 promise 报错异常上报
 */
interface DefaultOptons {
    uuid: string | undefined;
    requestUrl: string | undefined;
    historyTracker: boolean;
    hashTracker: boolean;
    domTracker: boolean;
    sdkVersion: string | number;
    extra: Record<string, any> | undefined;
    jsError: boolean;
}
interface Options extends Partial<DefaultOptons> {
    requestUrl: string;
}
type reportTrackerData = {
    [key: string]: any;
    event: string;
    targetKey: string;
};

declare class Tracker {
    userOpt: Options;
    private version;
    constructor(options: Options);
    private initDef;
    /**
     * configuring user ID
     * @param uuid user id
     */
    setUserId<T extends DefaultOptons["uuid"]>(uuid: T): void;
    /**
     * user coustom field data
     * @param extra field data
     */
    setExtra<T extends DefaultOptons["extra"]>(extra: T): void;
    /**
     * user reporting
     * @param data user coustom data
     */
    sendTracker<T extends reportTrackerData>(data: T): void;
    /**
     * event catcher: Automatic reporting
     * @param MouseEventList mouse events
     * @param targetKey event type identifier
     * @param data
     */
    private captureEvents;
    private installInnerTrack;
    private targetKeyReport;
    private jsError;
    private errorEvent;
    private promiseReject;
    private reportTracker;
}

export { Tracker };
