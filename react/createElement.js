const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.flat().map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
};

const createTextElement = (text) => {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
};

export default createElement;
