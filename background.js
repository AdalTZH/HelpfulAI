// background.js
chrome.runtime.onConnect.addListener((port) => {
    console.log('Port connected:', port);
    port.onMessage.addListener((msg) => {
      console.log('Message received:', msg);
    });
  });
  