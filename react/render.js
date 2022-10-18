const render = (element, container) => {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);
  Object.keys(element.props)
    .filter((key) => key !== "children")
    .forEach((name) => (dom[name] = element.props[name]));
  container.appendChild(dom);
};

let nextUnitOfWork = null;

// 调度函数
const workLoop = (deadline) => {
  // 不应该交出控制权或不应该停止
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    // 执行工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 检测浏览器是否还有空余时间
    shouldYield = deadline.timeRemaining() < 1;
  }
  // 没有空余时间，将工作放到浏览器下一次空闲时执行
  requestIdleCallback(workLoop);
};
// 第一次请求
requestIdleCallback(workLoop);

const performUnitOfWork = (work) => {
  // TODO
};
export default render;
