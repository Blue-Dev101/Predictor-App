import * as ReactDOM from 'react-dom';
import "./index.css";
import App from "./App.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element");
}

import { createElement } from 'react';
ReactDOM.render(createElement(App), rootElement);
