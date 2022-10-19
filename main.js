import { createElement, render } from "./react";

/* <h1 id="title" style="background: green;">HelloWorld sibling</h1> */
const element = createElement(
  "h1",
  {
    id: "title",
    style: "background: green",
  },
  "HelloWorld",' sibling'
);

const container = document.querySelector("#root");

render(element, container);
