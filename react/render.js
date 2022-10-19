const createDom = (fiber) => {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  Object.keys(fiber.props)
    .filter((key) => key !== "children")
    .forEach((name) => (dom[name] = fiber.props[name]));
  return dom;
};

const commitRoot = () => {
  commitWork(wipRoot.child);
  console.log("commitRoot：[wipRoot]:", wipRoot);
  wipRoot = null;
};

const commitWork = (fiber) => {
  console.log("commitWork[fiber]:", fiber);
  if (!fiber) return;
  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);
  if (fiber.child) commitWork(fiber.child);
  if (fiber.sibling) commitWork(fiber.sibling);
};

// 初始化第一个工作单元 rootFiber
const render = (element, container) => {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    sibling: null,
    child: null,
    parent: null,
  };
  nextUnitOfWork = wipRoot;
  console.log("render:[wipRoot] ", wipRoot);
};

let nextUnitOfWork = null;
let wipRoot = null; // root copy
// 调度函数
const workLoop = (deadline) => {
  // 不应该交出控制权或不应该停止
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    // 执行工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 检测浏览器是否还有空余时间
    shouldYield = deadline.timeRemaining() < 1;
    console.log("workLoop: [nextUnitOfWork]", nextUnitOfWork, deadline.timeRemaining());
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  // 没有空余时间，将工作放到浏览器下一次空闲时执行
  requestIdleCallback(workLoop);
};

// 第一次请求
requestIdleCallback(workLoop);

const performUnitOfWork = (fiber) => {
  // 创建 DOM 元素
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // 给children添加fiber
  const elements = fiber.props.children;
  let prevSibling = null;
  // 构建Fiber tree
  for (let i = 0; i < elements.length; i++) {
    const newFiber = {
      type: elements[i].type,
      props: elements[i].props,
      parent: fiber,
      dom: null,
      child: null,
      sibling: null,
    };
    if (i === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
  }
  // 返回下一个fiber
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
};

export default render;
