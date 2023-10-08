# Tracker

A SDK data burying tool for the front end, the specific implementation details can be viewed 'src/core/index.ts'.

Of course, you can expand private needs on the basis of this library.

### Options introduction:

```ts
# configuring params
/**
 * @uuid user Id
 * @requestUrl 数据上报地址
 * @historyTracker history上报
 * @hashTracker hash上报
 * @domTracker 事件上报（需携带 Tracker-key）
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
  jsError: boolean;
  sdkVersion: string | number;
  extra: Record<string, any> | undefined;
}


# coustom report
export type reportTrackerData = {
  [ErrType: string]: {
    [key: string]: any;
    event: string;
    targetKey: string;
  };
};
```

### Usage:

```js
const tr = new Tracker.Tracker({
  requestUrl: "http://localhost:3300/xxxx", //接口地址
  historyTracker: true,
  domTracker: true,
  jsError: true,
});
```

### Feature:

1.  Page Viewer: `historyTracker: true or hashTracker: true`
2.  Dom tracker: `domTracker: true`
3.  Js Error: `jsError: true`, following events are monitored internally:
    - 1. SyntaxError
    - 2. RangeError
    - 3. ReferenceError
    - 4. EvalError
    - 5. TypeError
    - 6. URIError
    - 7. 资源加载错误

```js
# Dom tracker: 通过在元素上添加 target-key 属性，这样表可以在上报时携带元素数据信息
<button target-key="埋点值">按钮</button>
const tr = new Tracker({
  requestUrl: "http://localhost:3000/xxxx", //接口地址
  domTracker: true,
});


# 用户唯一表示 可以在登录之后通过接口返回的 id 进行设置值 提供了 setUserId
# 主要是给需要监听的元素添加一个属性 用来区分是否需要监听 target-key
tr.setUserId();


# Tracker 提供了自定义上报的能力，必须包含 event 和 targetKey  两个字段
tr.sendTracker({
	event: "",
	targetKey: "",
 });

# 同时，也存在一个可供用户进行数据携带的方法
tr.setExtra<T extends DefaultOptons["extra"]>()
```
