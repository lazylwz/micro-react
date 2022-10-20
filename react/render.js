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
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);

const updateDom = (dom, prevProps, nextProps) => {
  // 删除已经不存在的 props
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => (dom[name] = ""));
  // 添加新的或者改变的 props
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => (dom[name] = nextProps[name]));

  // 删除没有的或者改变的 events
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // 添加新的和改变的 events
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
};

const commitRoot = () => {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot; // 上一个 fiber
  wipRoot = null;
};

const commitWork = (fiber) => {
  console.log(fiber)
  if (!fiber) return;
  const domParent = fiber.parent.dom;
  if (fiber.effectFlag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectFlag === "DElETION") {
    domParent.removeChild(fiber.dom);
  } else if (fiber.effectFlag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }
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
    alternate: currentRoot, // 上一次fiber
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
};

let nextUnitOfWork = null;
let wipRoot = null; 
let currentRoot = null;
let deletions = null;

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
  // 创建 DOM 元素
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // 给children添加fiber
  const elements = fiber.props.children;
  // 新建newFiber
  reconcileChildren(fiber, elements);
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
