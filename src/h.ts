// src/jsx-runtime.ts
import { createEffect } from './core/solid'; // 假设你的响应式代码在这个文件里

export function h(tag: any, props: any, ...children: any[]): Node {
    // 1. 处理函数式组件
    if (typeof tag === 'function') {
        return tag({ ...props, children });
    }

    const el = document.createElement(tag);

    // 2. 处理属性 (Props)
    if (props) {
        for (const [key, value] of Object.entries(props)) {
            // 事件绑定不需要响应式更新
            if (key.startsWith('on') && typeof value === 'function') {
                const eventName = key.slice(2).toLowerCase();
                el.addEventListener(eventName, value as EventListener);
            }
            // 核心 1：如果属性是一个函数，说明它是响应式的 getter
            else if (typeof value === 'function') {
                createEffect(() => {
                    const val = value(); // 执行 getter 获取最新值，并收集依赖
                    if (key === 'className') {
                        el.className = val;
                    } else if (key === 'style' && typeof val === 'object') {
                        Object.assign(el.style, val);
                    } else {
                        el.setAttribute(key, val);
                    }
                });
            }
            // 静态普通属性
            else {
                if (key === 'className') {
                    el.className = value as string;
                } else if (key === 'style' && typeof value === 'object') {
                    Object.assign(el.style, value);
                } else {
                    el.setAttribute(key, value as string);
                }
            }
        }
    }

    // 3. 处理子节点 (Children)
    children.flat(Infinity).forEach((child) => {
        if (child == null || typeof child === 'boolean') return;

        // 核心 2：如果子节点是函数，说明它是动态内容
        if (typeof child === 'function') {
            insertDynamicChild(el, child);
        } else if (child instanceof Node) {
            el.appendChild(child);
        } else {
            el.appendChild(document.createTextNode(String(child)));
        }
    });

    return el;
}

export function Fragment({ children }: { children?: any[] }) {
    const frag = document.createDocumentFragment();
    if (children) {
        children.flat(Infinity).forEach((child) => {
            if (child == null || typeof child === 'boolean') return;
            if (typeof child === 'function') {
                insertDynamicChild(frag, child);
            } else if (child instanceof Node) {
                frag.appendChild(child);
            } else {
                frag.appendChild(document.createTextNode(String(child)));
            }
        });
    }
    return frag;
}

// src/h.ts (内部辅助函数)
// ✨ 修复 1：增加 anchor（锚点）参数，默认值为 null (相当于 appendChild)
function insertDynamicChild(parent: Node, childFn: Function, anchor: Node | null = null) {
    const marker = document.createComment('dynamic');

    // 准确插入：如果有锚点就插在锚点前，否则插在末尾
    parent.insertBefore(marker, anchor);

    //  修复 2：类型升级。记录列表里不仅可以是真实的 DOM 节点，还可以是嵌套对象的“清理函数”
    let currentNodes: (Node | { destroy: () => void })[] = [];

    // 提取公共清理逻辑：卸载当前层级的所有 DOM，并递归卸载子层级
    const clearNodes = () => {
        currentNodes.forEach(item => {
            if ('destroy' in item) {
                item.destroy(); // 这是一个嵌套的响应式子节点，调用它的清理函数
            } else if (item.parentNode) {
                item.parentNode.removeChild(item); // 这是一个普通的 DOM 节点，直接拔掉
            }
        });
        currentNodes = []; // 清空账本
    };

    // 使用 createEffect 包裹，数据变化时更新 DOM
    createEffect(() => {
        const newVal = childFn(); // 获取最新状态

        clearNodes(); // 执行前先全拔掉旧的

        const newNodes = Array.isArray(newVal) ? newVal : [newVal];

        newNodes.flat(Infinity).forEach(n => {
            if (n == null || typeof n === 'boolean') return;

            // 处理嵌套的响应式函数
            if (typeof n === 'function') {
                if (marker.parentNode) {
                    // 核心逻辑：以当前的 marker 作为锚点，往里递归
                    // 并把内层返回的 destroy 记录到当前层的 currentNodes 中
                    const destroyInner = insertDynamicChild(marker.parentNode, n, marker);
                    currentNodes.push({ destroy: destroyInner });
                }
                return;
            }

            // 处理普通节点
            const nodeToInsert = n instanceof Node
                ? n
                : document.createTextNode(String(n));

            if (marker.parentNode) {
                marker.parentNode.insertBefore(nodeToInsert, marker);
                currentNodes.push(nodeToInsert);
            }
        });
    });

    // ✨ 终极绝招：把销毁自己（包括自己的 DOM 节点 和 自己的 marker）的方法，暴露给外层！
    return () => {
        clearNodes();
        if (marker.parentNode) {
            marker.parentNode.removeChild(marker);
        }
    };
}

