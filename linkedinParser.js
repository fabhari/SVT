import { Trie } from "./trie.js";

let trie = null;

const getTrie = () => {
  if (trie === null) {
    trie = new Trie();
  }
  return trie;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let payload = { action: "COMPANY_NAME", data: "" };

const sendCompanyName = (companyData) => {
  // return new Promise((resolve, reject) => {
  // console.log("sending Company Name to background script", companyData);
  payload.data = companyData;
  chrome.runtime.sendMessage(payload, (response) => {
    if (response) {
      // console.log("Response from background script:", response);
    } else {
      // console.log("No response from background script.");
    }
  });
  // })
};

function getCompanyDetails(companyName) {
  const data = getTrie()?.findSuggestions(companyName);
  // console.log(data);
  return data;
}
//actual code to check if company is visa sponsor
function isVisaSponsor(companyName) {
  const data = getTrie()?.findSuggestions(companyName);
  // sendCompanyName(companyName);
  // console.log(data);
  return data.length > 0;
}

export class LinkedinParser {
  constructor() {
    this.data = [];
    this.linkedinJobContainer = "scaffold-layout__list ";
    this.linkedinJobPostingClass = "artdeco-entity-lockup__subtitle";
    this.linkedinSelectedTitle =
      "job-details-jobs-unified-top-card__company-name";
    try {
      getTrie()?.initialize();
    } catch (error) {
      console.log("Error:", error);
    }
  }

  async setupJobContainerObserver() {
    await sleep(2000);
    const jobContainer = document.querySelector(
      `.${this.linkedinJobContainer}`
    );
    if (!jobContainer) {
      // console.log("Job container not found, will retry...");
      return false;
    }

    const selectedCompanyName = document.querySelector(
      `.${this.linkedinSelectedTitle}`
    );

    // console.log("selected company name", selectedCompanyName);

    this.processSelectedCompanyName(selectedCompanyName);

    const existingJobs = jobContainer.querySelectorAll(
      `.${this.linkedinJobPostingClass}`
    );
    existingJobs.forEach((jobElement) => {
      this.processJobElement(jobElement);
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const jobElement = node.querySelector(
              `.${this.linkedinJobPostingClass}`
            );
            if (jobElement) {
              this.processJobElement(jobElement);
            }
          }
        });
      });
    });

    observer.observe(jobContainer, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return true;
  }

  processSelectedCompanyName(companyElement) {
    const companyName = companyElement?.innerText?.trim();
    if (!companyName) {
      return;
    }
    const data = getCompanyDetails(companyName);
    if (data != []) {
      // console.log("selected company data from trie..", data);
    }
    // if () {
    //   companyElement.innerHTML = `${companyName} - UK Visa Sponsor`;
    // } else {
    //   companyElement.innerHTML = `${companyName} - Not UK Visa Sponsor`;
    // }
  }

  processJobElement(jobElement) {
    const nextElement = jobElement.nextSibling;
    if (nextElement?.classList?.contains("visa-status-indicator")) {
      return;
    }
    const companyName = jobElement.textContent.split("·")[0].trim();
    const statusElement = document.createElement("div");
    statusElement.classList.add("visa-status-indicator");

    if (isVisaSponsor(companyName)) {
      statusElement.innerHTML = `<span style="background-color: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px;">${companyName} - UK Visa Sponsor</span>`;
    } else {
      statusElement.innerHTML = `<span style="background-color: #f44336; color: white; padding: 2px 6px; border-radius: 3px;">${companyName} - Not UK Visa Sponsor</span>`;
    }

    jobElement.parentNode.insertBefore(statusElement, jobElement.nextSibling);
  }
}
