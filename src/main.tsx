import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./utils/menuDataInitializer"; // Auto-initializes 50-item menus
import "./utils/testMenuSystem"; // Test system for debugging

createRoot(document.getElementById("root")!).render(<App />);
