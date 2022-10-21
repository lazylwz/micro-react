import { createElement, render } from "./react";

const handleInput = (e) => {
  renderer(e.target.value);
};

const funcComponent = (props) => {
    return createElement("h1", { style: "background: green" }, props.title)
}

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
    createElement("h1", { style: "background: red" }, value),
    createElement(funcComponent,{title: 'hah'})
  );
  render(element, container);
};
renderer();
