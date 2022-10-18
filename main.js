import { createElement, render } from "./react";

const element = createElement(
  "h1",
  {
    id: "title",
    style: "background: green",
  },
  "HelloWorld"
);

const container = document.querySelector("#root");

render(element, container);
