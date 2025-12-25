export class GrimoireObserver {
  constructor() {
    this.observer = null;
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  observe(node) {
    if (this.observer) this.observer.disconnect();
    this.observer = new MutationObserver(this.callback.bind(this));
    this.observer.observe(node, { childList: true });
  }

  callback(mutationList) {
    mutationList.forEach(mutation => {
      if (mutation.type === 'childList') {
        Array.from(mutation.addedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).forEach(node => {
          if (node.matches('div.user')) {
            const userIdLi = node.querySelector('ul.profile > li');
            const userIdText = this.getTextNode(userIdLi);
            if (!userIdText) return;
            this.waitForElementToHaveContent(userIdText).then(() => {
              this.insertAddToListSelector(userIdLi);
            });
          }
        });
      }
    });
  }

  waitForElementToHaveContent(element, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (element && element.textContent.trim() !== '') {
        resolve(element);
        return;
      }
      const timer = setTimeout(() => {
        observer.disconnect();
        reject(new Error('Timeout waiting for element to have content'));
      }, timeout);
      const observer = new MutationObserver((mutationList, observer) => {
        mutationList.forEach(mutation => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            if (element && element.textContent.trim() !== '') {
              observer.disconnect();
              clearTimeout(timer);
              resolve(element);
            }
          }
        });
      });
      observer.observe(element, { childList: true, characterData: true });
    });
  }
}
