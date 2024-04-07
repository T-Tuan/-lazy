import { isHasObject, toArray } from "@utilslib/core";

/**
 * 获取给定内容插入到指定 DOM 节点后，该节点在父容器中占据的行数。
 *
 * @bate
 * @param parent - 父容器 DOM 节点。
 * @param content - 要插入的内容。
 * @param insertBefore - 要插入在哪个 DOM 节点之前，默认为 null，表示插入到末尾。
 * @returns 插入内容后节点在父容器中占据的行数。
 */
export function getLinesCountAfterInsertion(
  parent: HTMLElement,
  content: string | HTMLElement,
  insertBefore: HTMLElement | null = null
): number {
  const clone = document.createElement("div");
  clone.style.cssText = "visibility: hidden;";

  if (typeof content === "string") {
    clone.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    clone.appendChild(content);
  }

  parent.insertBefore(clone, insertBefore);
  const lineHeight = parseFloat(getComputedStyle(clone).lineHeight);
  const clientHeight = clone.clientHeight;
  parent.removeChild(clone);

  return Math.ceil(clientHeight / lineHeight);
}

/**
 * 获取给定图片链接的宽度和高度。
 *
 * @param imageUrl - 图片链接。
 * @returns 返回一个 Promise，解析为包含宽度和高度的对象 { width, height }。
 */
export function getImageSize(imageUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.width, height: image.height });
    };
    image.onerror = () => {
      reject(new Error("Failed to load image."));
    };
    image.src = imageUrl;
  });
}

/**
 * 监听鼠标点击事件，如果点击事件不包含指定的元素，则触发回调函数，并返回一个销毁监听事件的方法。
 *
 * @param target - 要监听的目标元素或元素数组。
 * @param callback - 鼠标点击事件不包含目标元素时触发的回调函数。
 * @returns 一个函数，用于销毁监听事件。
 */
export function listenClickOutside<T extends string | Element | undefined>(
  target: T | T[],
  callback: () => void
): () => void {
  function getEls(target: any): Element[] {
    if (typeof target === "string") {
      return [...document.querySelectorAll(target)].filter(Boolean);
    } else if (target instanceof Element) {
      return toArray(target);
    } else if (Array.isArray(target)) {
      return target.map((i) => getEls(i)).flat();
    }

    return [];
  }

  const handleClickOutside = (event: MouseEvent) => {
    const els = getEls(target).filter((el) => el instanceof Element);
    const isClickOutside = els.every((target) => !target.contains(event.target as Node));
    if (isClickOutside) {
      callback();
    }
  };

  document.addEventListener("click", handleClickOutside);

  return () => {
    document.removeEventListener("click", handleClickOutside);
  };
}

/**
 * 下载一个 Blob 对象作为指定文件名的文件。
 *
 * @param url - 要下载的文件链接
 * @param fileName - 要保存的文件名。
 */
export function downloadFileByUrl(url: string, fileName: string = ""): void {
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = fileName;
  downloadLink.click();
  downloadLink.remove();
}

/**
 * 下载一个 Blob 对象作为指定文件名的文件。
 *
 * @param blob - 要下载的 Blob 对象。
 * @param fileName - 要保存的文件名。
 */
export function downloadFileByBlob(blob: Blob, fileName: string = ""): void {
  const url = URL.createObjectURL(blob);
  downloadFileByUrl(url, fileName);
  URL.revokeObjectURL(url);
}

/**
 * 下载文件。
 *
 * @param src - 要下载的资源（可以是字符串或 Blob 对象）
 * @param fileName - 要保存的文件名。
 */
export function downloadFile(src: Blob | string, fileName: string = ""): void {
  let url;
  if (typeof src === "string") {
    url = src;
  } else {
    url = URL.createObjectURL(src);
  }

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = fileName;
  downloadLink.click();
  downloadLink.remove();

  URL.revokeObjectURL(url);
}

/**
 * 动态加载一组 JavaScript 文件。
 *
 * @param files - 要加载的 JavaScript 文件数组。
 * @returns 返回一个 Promise，在所有文件加载完成后解析。
 */
export function loadJS(
  files: string | string[],
  config?: Pick<Partial<HTMLScriptElement>, "type" | "async">
): Promise<void[]> {
  // 获取head标签
  const head = document.getElementsByTagName("head")[0];

  files = toArray(files);

  // 使用 Promise.all 并行加载所有文件
  return Promise.all(
    files.map((file) => {
      return new Promise<void>((resolve, reject) => {
        // 创建script标签并添加到head
        const scriptElement = document.createElement("script");
        scriptElement.type = "text/javascript";
        scriptElement.async = true;
        scriptElement.src = file;

        // 添加自定义属性
        if (isHasObject(config)) {
          Object.entries(config).forEach(([key, val]) => {
            scriptElement.setAttribute(key, String(val));
          });
        }

        // 监听load事件，如果加载完成则resolve
        scriptElement.addEventListener("load", () => resolve(), false);

        // 监听error事件，如果加载失败则reject
        scriptElement.addEventListener(
          "error",
          () => reject(new Error(`Failed to load script: ${file}`)),
          false
        );

        head.appendChild(scriptElement);
      });
    })
  );
}

/**
 * 用于添加事件监听器的函数
 * @returns 返回一个函数，用于添加指定事件的监听器
 */
export const on = ((): any => {
  if (Boolean(document.addEventListener)) {
    return (
      element: Node,
      event: string,
      handler: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): any => {
      if (element && event && handler) {
        element.addEventListener(event, handler, options);
      }
    };
  }
  return (element: Node, event: string, handler: EventListenerOrEventListenerObject): any => {
    if (element && event && handler) {
      (element as any).attachEvent(`on${event}`, handler);
    }
  };
})();

/**
 * 用于移除事件监听器的函数
 * @returns 返回一个函数，用于移除指定事件的监听器
 */
export const off = ((): any => {
  if (Boolean(document.removeEventListener)) {
    return (
      element: Node,
      event: string,
      handler: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): any => {
      if (element && event) {
        element.removeEventListener(event, handler, options);
      }
    };
  }
  return (element: Node, event: string, handler: EventListenerOrEventListenerObject): any => {
    if (element && event) {
      (element as any).detachEvent(`on${event}`, handler);
    }
  };
})();

/**
 * 检查一个DOM元素是否是另一个DOM元素的后代。
 *
 * @param parent - 要检查的父DOM元素。
 * @param child - 要检查的子DOM元素。
 * @returns 如果子元素是父元素的后代，则返回true，否则返回false。
 */
export function containerDom(
  parent: Element | Iterable<any> | ArrayLike<any>,
  child: any
): boolean {
  if (parent && child) {
    let pNode = child;
    while (pNode) {
      if (parent === pNode) {
        return true;
      }
      const { parentNode } = pNode;
      pNode = parentNode;
    }
  }
  return false;
}

/**
 * 点击元素外部的处理函数。
 *
 * @param els - 要排除在外的元素或元素集合。
 * @param cb - 点击元素外部时执行的回调函数。
 */
export function clickOut(els: Element | Iterable<any> | ArrayLike<any>, cb: () => void): void {
  on(document, "click", (event: { target: Element }) => {
    if (Array.isArray(els)) {
      const isFlag = Array.from(els).every((item) => containerDom(item, event.target) === false);
      return isFlag && cb && cb();
    }
    if (containerDom(els, event.target)) {
      return false;
    }
    return cb && cb();
  });
}

/**
 * 创建一个用于管理事件监听器的工具函数
 * @param elm - 要添加事件监听器的元素引用
 * @returns 返回一个包含添加和清除事件监听器功能的对象
 */
export function attachListeners(elm: Element) {
  const offs: Array<() => void> = [];
  return {
    add<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (ev: HTMLElementEventMap[K]) => void
    ) {
      if (!type) return;
      on(elm, type, listener);
      offs.push(() => {
        off(elm, type, listener);
      });
    },
    clean() {
      offs.forEach((handler) => handler?.());
      offs.length = 0;
    },
  };
}
