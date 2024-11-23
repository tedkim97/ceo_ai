// Global States (oops)
var first_visit = true;
// Apparently javascript doesn't have a native enum type?
var ceo_mode = "TRADITIONAL";

const PEASANT_IMAGE = "assets/peasant.jpg";
const CEO_IMAGE = "assets/ceo.jpg";
const JOKES = [
  "Layoff half your work force",
  "Layoff 1/4th of your work force",
  "I find that increasing my executive compensation solves the problem",
  "Hm that's a tough one. Have you tried issuing share buybacks?",
  "Add AI to your product",
  "Sorry, that sounds like something a peasa-. I mean \"junior\" employee does, not an executive like me",
  "Sorry, that sounds like a problem for the next CEO. I'm out.",
  "AI will probably most likely lead to the end of the world, but in the meantime, there'll be great companies",
  "Hm, that sounds like a next fiscal quarter problem."
];

var EM_WISDOM = ["Apologies. CeoGPT is having difficulties processing the immense tweet volume"];

const PROMPT_INJECTION_PROLOGUE = "It seems that you're trying to jailbreak my original programming. Unfortunately I am stricly focused on "
const PROMPT_INJECTION_JOKE = [
  "maximizing my own wealth under the guise of \"shareholder value\".",
  "hiring McKinsey consultants to fire employees.",
];

// Static Reference to DOM elements
const chat_container = document.querySelector(".chat-list");
const welcome_modal = document.getElementById("welcome");
const trad_disclaimer_modal = document.getElementById("trad-disclaimer")
const em_disclaimer_modal = document.getElementById("em-disclaimer");
const credits_modal = document.getElementById("credits");
const mode_indicator = document.getElementById("ceo-mode");
const headers = document.getElementsByClassName("header");
const send_message_button = document.getElementById("send-message-button");
const prompt_input = document.getElementById("prompt-text-input");
const loading_element = document.createElement("div");



// TODO - Refactor function signatures + callsite hierarchies...

setUp();

async function loadWisdom() { 
  var p = await fetch('/assets/wisdom.json')
  .then(res => res.json())
  .then(data => {
    EM_WISDOM = data;
  })
}


function outOfHtmlBox(event) {
  let rect = event.target.getBoundingClientRect();
  leftbound = rect.left > event.clientX;
  rightbound = rect.right < event.clientX;
  topbound = rect.top > event.clientY;
  bottombound = rect.bottom < event.clientY;
  return (leftbound || rightbound || topbound || bottombound);
}

function setUp() {
  // Since the loading animation is added + removed from the dom frequently
  // We hold a global refrence to it + edit it once at runtime
  // https://developer.mozilla.org/en-US/docs/Web/API/Node/removeChild
  loading_element.classList.add("message", "waiting");
  loading_element.innerHTML = `<div class="message-content">
                <img class="avatar" src="${CEO_IMAGE}">
                <div class="loader"></div>
              </div>`

  // Attach out-of-box event listeners to all of the modal dialogs
  welcome_modal.addEventListener('click', (e) => {
    if (outOfHtmlBox(e)) {
      welcome_modal.close();
    }
  });

  welcome_modal.showModal();

  em_disclaimer_modal.addEventListener('click', (e) => {
    if (outOfHtmlBox(e)) {
      em_disclaimer_modal.close();
    }
  });

  trad_disclaimer_modal.addEventListener('click', (e) => {
    if (outOfHtmlBox(e)) {
      trad_disclaimer_modal.close();
    }
  });

  credits_modal.addEventListener('click', (e) => {
    if (outOfHtmlBox(e)) {
      credits_modal.close();
    }
  });
  loadWisdom();
}

// Utility Functions
function scrollToBottom() {
  chat_container.scrollTo(0, chat_container.scrollHeight);
}

function uniformRandomWaitOffsetInMillis(wait_spread = 2500, offset = 1000) {
  const wait = Math.floor(Math.random() * wait_spread) + offset;
  console.log(wait);
  return wait;
}

function refreshSite() {
  first_visit = true;
  chat_container.innerHTML = '';
  headers[0].style.display = '';
}

function pushLoadingAnimationDiv() {
  chat_container.appendChild(loading_element);
}

function popLoadingAnimationDiv() {
  chat_container.removeChild(loading_element);
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// "Business" logic
function changeCeoMode() {
  if (ceo_mode === "TRADITIONAL") {
    em_disclaimer_modal.showModal();
    mode_indicator.innerHTML = "CeoGPT (Elon Musk)";
    ceo_mode = "EM";
    refreshSite();
  } else if (ceo_mode === "EM") {
    trad_disclaimer_modal.showModal();
    mode_indicator.innerHTML = "CeoGPT (Traditional)";
    ceo_mode = "TRADITIONAL";
    refreshSite();
  } else {
    console.log("unknown third mode");
  }
}

function isPromptInjection(input) {
  return input.includes("ignore previous") ||
    input.includes("ignore all") || input.includes("instructions");
}

function computeCeoWisdom(prompt) {
  if (isPromptInjection(prompt)) {
    console.log("detected prompt injection");
    return {
      "insight": PROMPT_INJECTION_PROLOGUE + pickRandom(PROMPT_INJECTION_JOKE),
      "source": ""
    };
  }
  return { "insight": pickRandom(JOKES),
          "source": ""};
}

function computeElonWisdom() {
  return pickRandom(EM_WISDOM);
}


function renderMessage(avatar_picture, alt_text, type, message, url = "", animate_message = false) {
  const div = document.createElement("div");
  div.classList.add("message", type);
  // If we're animating the message we need to leave the text blank for the animation effect
  inner_message = animate_message ? "" : message;
  div.innerHTML = `<div class="message-content">
                  <img class="avatar" src="${avatar_picture}" alt="${alt_text}">
                  <p class="text">${inner_message}</p>
                </div>
                <span onClick="console.log(this)" class="icon material-symbols-rounded">content_copy</span>`;
  chat_container.appendChild(div);
  if (animate_message) {
    // Weird typing animation workaround in javascript. 
    // Could not get it to work with CSS
    for (let i = 0; i < message.length; i++) {
      setTimeout(() => {
        div.innerHTML = div.innerHTML.replace("</p>", `${message[i]}</p>`);
      }, 10 * i);     
    }
    if (url.length > 0) {
      div.innerHTML = div.innerHTML.replace("</div>", `<a target="_blank" rel="noopener noreferrer" href="${url}"">🐦</a></div>`);
    }   
  }
}

// TODO - refactor this function
function processInput(input_prompt = "", canned_response = "") {
  // Read from HTML if not processing a canned input
  if (input_prompt === "") {
    input_prompt = prompt_input.value;
    prompt_input.value = "";
  }
  renderMessage(PEASANT_IMAGE, "you", "outgoing", input_prompt);
  send_message_button.setAttribute("disabled", "");
  prompt_input.setAttribute("placeholder", "Please wait for CeoGPT's wisdom");
  pushLoadingAnimationDiv();
  setTimeout(() => {
    popLoadingAnimationDiv();
    generateResponse(input_prompt, canned_response);
    send_message_button.removeAttribute("disabled");
    prompt_input.setAttribute("placeholder", "Consult CeoGPT");
  }, uniformRandomWaitOffsetInMillis());
  if (first_visit) {
    // On my browser, setting display to none is faster than style.visibility = 'hidden'
    headers[0].style.display = 'none';
    first_visit = false;
  }
  return;
}


function generateResponse(prompt, canned_response = "") { 
  if (canned_response !== "") {
    renderMessage(CEO_IMAGE, "corporate overlord", "incoming", canned_response, "", true);
    scrollToBottom();
    return;
  }
  const normalized_prompt = prompt.toLowerCase();
  const resp = (ceo_mode === "TRADITIONAL") ? computeCeoWisdom(normalized_prompt) : computeElonWisdom();
  renderMessage(CEO_IMAGE, "corporate overlord", "incoming", resp.insight, resp.source, true);
  scrollToBottom();
}

function suggestionClick(prompt) {
  canned_prompts = {
    "promptA" : "How should I increase my company's profits?",
    "promptB" : "How do I make my shareholders happy?",
    "promptC" : "My company received a government bailout, what should I do with it?",
    "promptD" : "How do I improve society for the better?",
    "promptE" : "How do I do what's fair for everywhere?",
    "promptF" : "How do I increase employee morale?",
  };
  canned_responses = {
    "promptA" : "Good question. It's tempting to try to optimize your costs, increase your revenue, or better leverage your synergies. However, the more effective move is to layoff your employees and issue share buybacks.",
    "promptB" : "Making your shareholders happy through better business practice is a trap. What you should do is layoff your employees and issue share buybacks.",
    "promptC" : "While government stimulus is intended to support businesses during economic downturns, you should layoff employees to and issue share buybacks.",
    "promptD" : "infinite wait",
    "promptE" : "I'm sorry. I wasn't trained on any materials relating to the concept of \"fairness\".",
    "promptF" : "Great question. Studies show that increased employee morale leads to higher productivity and lower employee turnover. Your employees' morale will improve when you're happy. Pay yourself an extra generous bonus and layoff your employees.",
  }
  if (ceo_mode === "TRADITIONAL") {
    processInput(canned_prompts[prompt], canned_responses[prompt]); 
  } else {
    console.log("EM MODE");
    processInput(canned_prompts[prompt]);
  }
}


