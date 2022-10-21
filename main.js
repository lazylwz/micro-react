import { createElement, render, useState } from "./react";

const funcComponent = () => {
  const [state, setState] = useState(0);
  return createElement(
    "h1",
    { onclick: () => setState((state) => state + 1) },
    state
  );
};

const renderer = (value) => {
  const container = document.querySelector("#root");
  const element = createElement(funcComponent);
  render(element, container);
};
renderer();
