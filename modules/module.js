'use strict';

/**
 * 指定した要素の子要素を全削除する
 * @param {HTMLElement} element 
 */
function removeAllChildren(element) {
  while (element.firstChild) {
      element.removeChild(element.firstChild);
  }
}

export { removeAllChildren };