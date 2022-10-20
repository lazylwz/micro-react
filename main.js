import { createElement, render } from "./react";

const handleInput = (e) => {
  renderer(e.target.value);
};
const renderer = (value) => {
  const container = document.querySelector("#root");
  const element = createElement(
    "div",
    null,
    createElement(
      "input",
      { id: "input", oninput: (e) => handleInput(e) },
      null
    ),
    createElement("h1", { style: "background: red" }, value)
  );
  render(element, container);
};
renderer();
