// src/ui/toast.ts

// 引入编译后的 SCSS 字符串 (Vite 用法，如果是其他打包工具请参考对应文档)
import toastStyles from './toast.scss?inline';

class ShadowToastContainer extends HTMLElement {
  private wrapper: HTMLDivElement;

  constructor() {
    super();
    // 开启 Shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });

    // 创建 style 标签并塞入从 SCSS 编译来的纯文本样式
    const style = document.createElement('style');
    style.textContent = toastStyles;

    // 创建承载多条消息的真实父壳子
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'toast-wrapper';

    // 挂载到 shadow root 下
    shadow.appendChild(style);
    shadow.appendChild(this.wrapper);
  }

  // 内部动态创建单个 Toast 的方法
  addToast(message: string, type: 'success' | 'error', duration = 3000) {
    const el = document.createElement('div');
    el.className = `el-message-custom el-message-${type}`;
    el.innerText = message;

    this.wrapper.appendChild(el);

    // 触发划入动画
    requestAnimationFrame(() => {
      el.classList.add('show');
    });

    // 定时销毁
    setTimeout(() => {
      this.removeToast(el);
    }, duration);
  }

  // 新增：动态创建 Confirm 对话框的方法
  addConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'el-message-custom el-message-confirm';

      // 文本部分
      const textEl = document.createElement('div');
      textEl.className = 'confirm-message';
      textEl.innerText = message;

      // 按钮组部分
      const actionsEl = document.createElement('div');
      actionsEl.className = 'confirm-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn-cancel';
      cancelBtn.innerText = '取消';

      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'btn-confirm';
      confirmBtn.innerText = '确定';

      actionsEl.appendChild(cancelBtn);
      actionsEl.appendChild(confirmBtn);

      el.appendChild(textEl);
      el.appendChild(actionsEl);

      this.wrapper.appendChild(el);

      // 触发划入动画
      requestAnimationFrame(() => el.classList.add('show'));

      // 处理点击事件并返回 Promise 结果
      const handleAction = (result: boolean) => {
        this.removeToast(el);
        resolve(result);
      };

      cancelBtn.onclick = () => handleAction(false);
      confirmBtn.onclick = () => handleAction(true);
    });
  }

  // 提取公共的移除逻辑
  private removeToast(el: HTMLDivElement) {
    el.classList.remove('show');
    el.addEventListener('transitionend', () => {
      el.remove();
      // 如果容器空了，把自定义标签也从页面上移除，保持 DOM 干净
      if (this.wrapper.children.length === 0) {
        this.remove();
        containerInstance = null;
      }
    });
  }
}

// 注册全局自定义组件标签
if (!customElements.get('shadow-toast-container')) {
  customElements.define('shadow-toast-container', ShadowToastContainer);
}

let containerInstance: any = null;

// 获取或创建页面上的唯一容器实例
function getContainer() {
  if (!containerInstance || !document.body.contains(containerInstance)) {
    if (typeof document !== 'undefined') {
      containerInstance = document.createElement('shadow-toast-container');

      // 添加框架防误删属性
      containerInstance.setAttribute("wire:ignore", "");
      containerInstance.setAttribute("data-turbo-permanent", "");
      containerInstance.setAttribute("data-pjax-ignore", "");

      document.body.appendChild(containerInstance);
    }
  }
  return containerInstance;
}

// 对外导出完全一致的 ES Module 接口
const toast = {
  success(message: string, duration = 3000) {
    getContainer().addToast(message, 'success', duration);
  },
  error(message: string, duration = 3000) {
    getContainer().addToast(message, 'error', duration);
  },
  // 新增对外 confirm 方法
  confirm(message: string): Promise<boolean> {
    return getContainer().addConfirm(message);
  }
};

export default toast;