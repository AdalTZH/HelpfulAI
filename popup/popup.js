import {
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory
  } from '../node_modules/@google/generative-ai/dist/index.mjs';



const apiKey = 'YOUR API KEY';

const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE
    }
];
var generationConfig = {
    temperature: 1
  };
var genAI = new GoogleGenerativeAI(apiKey);
var model = genAI.getGenerativeModel({
    model: 'gemini-1.0-pro',
    safetySettings,
    generationConfig
});


  // Select elements
const inputField = document.getElementById('input');
const sendButton = document.getElementById('send');
const responseContainer = document.getElementById('response');
const loader = document.querySelector('.loader');

  

const prompt_template = "system: You are HAI, an assistant for question-answering tasks. You need to answer the question based on the context below. If you don't know the answer, just say that you don't know. Keep the answer clear."

function createPrompt(context, query){
    let completePrompt = `${prompt_template} Context: ${context} Question: ${query}`
    return completePrompt
}

async function generate(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (e) {
      console.log('Generation failed');
      console.error(e);
      throw e;
    }
  }

// This function will be used to navigate between pages
function navigate(pageId) {
    console.log('Navigating to:', pageId); // Debugging line
  
    // Get all elements with the class 'page'
    const pages = document.querySelectorAll('.page');
  
    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('active');
    });
  
    // Show the selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
  }


function handleUserInput() {
    loader.hidden = false;
  // Get the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const tabUrl = activeTab.url;

      // Check if the tab URL is accessible
      if (tabUrl.startsWith("chrome://") || tabUrl.startsWith("about:") || tabUrl.startsWith("chrome-extension://")) {
          responseContainer.textContent = "Cannot access this tab.";
          responseContainer.style.color = "red";
          console.error("Cannot access a chrome:// URL or restricted page.");
          loader.hidden = true;
          return;
      }

      // Inject a script into the accessible tab
      chrome.scripting.executeScript(
          {
              target: { tabId: activeTab.id },
              func: () => {
                  const selectedText = window.getSelection().toString();
                  chrome.runtime.sendMessage({ action: "sendSelectedText", text: selectedText });
              },
          },
          () => {
              if (chrome.runtime.lastError) {
                  console.error(chrome.runtime.lastError.message);
                  loader.hidden = true;
              }
          }
      );
  });
}



// Listen for the selected text sent by the injected script
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "sendSelectedText") {
        if (message.text.trim() !== "" && inputField.value.trim() !== "") {
            const prompt = createPrompt(message.text, inputField.value);
            try {
                const generatedText = await generate(prompt);
                responseContainer.textContent = generatedText;
            } catch (e) {
                responseContainer.textContent = "Error generating response.";
                console.error(e);
            } finally {
                loader.hidden = true; // Always hide the loader after completion
            }
            console.log(message.text);
            responseContainer.style.color = "black";
        } else {
            loader.hidden = true;
            } if (message.text.trim() == "") {
                responseContainer.textContent = "No text selected.";
                responseContainer.style.color = "red";

            } else if (inputField.value.trim() == "") {
                responseContainer.textContent = "Please enter query.";
                responseContainer.style.color = "red";
            }
        }
    }
);



// Add event listeners for button clicks and Enter key presses
sendButton.addEventListener('click', handleUserInput);
inputField.addEventListener('keydown', (event) => {
    if (event.key === "Enter") {
        handleUserInput();
    }
});





