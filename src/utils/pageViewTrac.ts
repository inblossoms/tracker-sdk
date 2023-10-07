/**
 * history API 构造类
 * @param type pushState | replaceState
 * @returns
 */
export const createHistoryEvent = <T extends keyof History>(
  type: T
): (() => any) => {
  const origin = history[type];

  return function (this: any) {
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
