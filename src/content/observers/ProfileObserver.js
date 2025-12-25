export class ProfileObserver {
  constructor(node) {
    this.observer = null;
    this.node = node;
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  waitForElementToHaveContent(element, timeout = 5000) {
    return new Promise((resolve, reject) => {
      // If the element already has content, resolve immediately
      if (element && element.textContent.trim() !== '') {
        resolve(element);
        return;
      }

      // Set up a timeout to reject the promise if it takes too long
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