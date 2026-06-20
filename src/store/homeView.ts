
// src/store/homeView.ts
import { createSignal } from "solid-js";

const [isHomeOpen, setIsHomeOpen] = createSignal(false);

export { isHomeOpen };

export const openHome = () => setIsHomeOpen(true);
export const closeHome = () => setIsHomeOpen(false);