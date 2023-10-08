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
export interface DefaultOptons {
  uuid: string | undefined;
  requestUrl: string | undefined;
  historyTracker: boolean;
  hashTracker: boolean;
  domTracker: boolean;
  sdkVersion: string | number;
  extra: Record<string, any> | undefined;
  jsError: boolean;
}

export interface Options extends Partial<DefaultOptons> {
  requestUrl: string;
}

/**
 * @version sdk
 */
export enum TrackerConfig {
  version = "1.0.0",
}

export type reportTrackerData = {
  [ErrType: string]: {
    [key: string]: any;
    event: string;
    targetKey: string;
  };
};
