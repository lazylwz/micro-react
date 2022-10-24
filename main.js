import { createElement, render, useState } from "./react";

const funcComponent = () => {
  const [state, setState] = useState(0);
  const nodes =  ['节点1','节点2','节点3']
  const list = createElement(
    "ul",
    null,
    nodes.map(node => createElement("li", null, node))
  );
  return createElement(
    "h1",
    {
      onclick: () => setState((state) => state + 1),
      style: { backgroundColor: "grey", marginTop: `${state * 10}px` },
    },
    state,
    list
  );
};

const renderer = (value) => {
  const container = document.querySelector("#root");
  const element = createElement(funcComponent);
  render(element, container);
};
renderer();
