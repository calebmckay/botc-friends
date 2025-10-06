window.browser = window.browser || window.chrome;

window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'BOTC_GET_LISTS') {
    browser.storage.local.get(['friends', 'block']).then(data => {
      window.postMessage({
        type: 'BOTC_SET_LISTS',
        friends: data.friends || [],
        block: data.block || []
      }, '*');
    });
  }
});

const script = document.createElement('script');
script.src = browser.runtime.getURL('background.js');
document.documentElement.appendChild(script);