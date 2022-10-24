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

const isEvent = (key) => key.startsWith("on");
const isStyle = (key) => key === "style";
const isProperty = (key) =>
  key !== "children" && !isEvent(key) && !isStyle(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (next) => (key) => !(key in next);

const updateDom = (dom, prevProps, nextProps) => {
  const prevStyle = prevProps.style || {};
  const nextStyle = nextProps.style || {};
  // 删除已经不存在的 props
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(nextProps))
    .forEach((name) => (dom[name] = ""));
  // 添加新的或者改变的 props
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => (dom[name] = nextProps[name]));
  // 删除没有的或者改变的 events
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(isGone(nextProps) || isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });
  // 添加新的 events
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
  // 删除已经不存在的 style
  Object.keys(prevStyle)
    .filter(isGone(nextStyle))
    .forEach((name) => (dom.style[name] = ""));
  // 添加新的 style
  Object.keys(nextStyle).forEach((name) => (dom.style[name] = nextStyle[name]));
};

const commitRoot = () => {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot; // 上一个 fiber
  wipRoot = null;
};

const commitWork = (fiber) => {
  if (!fiber) return;
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;
  if (fiber.effectFlag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectFlag === "DElETION") {
    commitDeletion(fiber, domParent);
  } else if (fiber.effectFlag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }
  if (fiber.child) commitWork(fiber.child);
  if (fiber.sibling) commitWork(fiber.sibling);
};

// 函数组件(没有自己的DOM)特殊处理：向下寻找最近的 child 节点dom进行删除
const commitDeletion = (fiber, domParent) => {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
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
    alternate: currentRoot, // 上一次fiber
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
};

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = null;
let wipFiber = null;
let hookIndex = null;
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
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  // 没有空余时间，将工作放到浏览器下一次空闲时执行
  requestIdleCallback(workLoop);
};

// 第一次请求
requestIdleCallback(workLoop);

const performUnitOfWork = (fiber) => {
  const isFunctionComponent = fiber.type instanceof Function;
  isFunctionComponent
    ? updateFunctionComponent(fiber)
    : updateHostComponent(fiber);
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

const updateHostComponent = (fiber) => {
  // 创建 DOM 元素
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // 新建newFiber
  reconcileChildren(fiber, fiber.props.children);
};

const updateFunctionComponent = (fiber) => {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
};

export const useState = (init) => {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : init,
    queue: [],
  };
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => (hook.state = action(hook.state)));
  const setState = (action) => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
};

const reconcileChildren = (wipFiber, elements) => {
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;
  let newFiber = null;
  for (let i = 0; i < elements.length; i++) {
    const sameType =
      oldFiber && elements[i] && elements[i].type === oldFiber.type;
    /* 
            类型相同：
                复用节点进行更新
            类型不同:
                创建新的DOM节点
                旧节点存在进行删除
        */
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: elements[i].props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectFlag: "UPDATE",
      };
    }
    if (!sameType && elements[i]) {
      newFiber = {
        type: elements[i].type,
        props: elements[i].props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectFlag: "PLACEMENT",
      };
    }
    if (!sameType && oldFiber) {
      oldFiber.effectFlag = "DELETION";
      deletions.push = [oldFiber];
    }
    if (oldFiber) oldFiber = oldFiber.sibling;
    if (i === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
  }
};

export default render;
