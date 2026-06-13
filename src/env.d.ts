

// global.d.ts
import { h as _h, Fragment as _Fragment } from './h';

declare global {
    const h: typeof _h;
    const Fragment: typeof _Fragment;
    // 声明全局 JSX 命名空间
    namespace JSX {
        type Element = HTMLElement | DocumentFragment;
        interface IntrinsicElements {
            [elemName: string]: any;
        }
    }
}