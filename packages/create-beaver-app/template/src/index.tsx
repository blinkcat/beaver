import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

import './index.css';

if (process.env.SSG) {
  ReactDOM.hydrate(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
    document.getElementById('root')
  );
} else {
  ReactDOM.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
    document.getElementById('root')
  );
}
