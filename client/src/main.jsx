import { createRoot } from 'react-dom/client'
import AppProvider from "./app/AppProvider";
import Boot from './app/Boot.js';
import './index.css'

Boot();

createRoot(document.getElementById('root')).render(
  <AppProvider/>,
)
