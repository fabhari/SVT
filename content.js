import { LinkedinParser } from "./linkedinParser.js";

let linkedinParser = null;

// tAwuDyPkXRFipemrPiTUbCCSWPlFqctmjJVaM

//------------ Linkedin Parser ------------

//--Tree Data Structure--

//------------ Actual Code ------------

export const config = {
  matches: ["https://www.linkedin.com/*"],
};
(async () => {
  linkedinParser = new LinkedinParser();

  const JobSite = {
    LInkedin: 1,
    Glassdoor: 2,
    Monster: 3,
    Indeed: 4,
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Start Linkedin Parsing...");
    if (message.action === "PARSE_JOBS") {
      console.log("PARSE_JOBS");
      linkedinParser.setupJobContainerObserver();
    }
  });
})();
