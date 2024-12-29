// Send message to background
const JobSite = {
  LInkedin : 1,
  Glassdoor : 2,
  Monster : 3,
  Indeed : 4
}

const LinkedinJobContainer = 'rjmNTMLkNvPwnJnFTCybgSFpgYGQ';
const LinkedinJobPostingClass = 'qWfdXzyeXDuRARonfVAolXAIekneWwGdBuiY';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Start Linkedin Parsing...");
  if (message.action === 'PARSE_JOBS') {
    console.log("PARSE_JOBS");
    setupJobContainerObserver(); 
  }
});

function isVisaSponsor(companyName) {
  const sponsorList = ['Company A', 'Company B']; 
  return sponsorList.includes(companyName);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setupJobContainerObserver() {
  await sleep(2000);
  const jobContainer = document.querySelector(`.${LinkedinJobContainer}`);
  if (!jobContainer) {
    console.log('Job container not found, will retry...');
    return false;
  }

  const existingJobs = jobContainer.querySelectorAll(`.${LinkedinJobPostingClass}`);
  existingJobs.forEach(jobElement => {
    processJobElement(jobElement);
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const jobElement = node.querySelector(`.${LinkedinJobPostingClass}`);
          if (jobElement) {
            processJobElement(jobElement);
          }
        }
      });
    });
  });

  observer.observe(jobContainer, {
    childList: true,     
    subtree: true,      
    attributes: true
  });

  return true;
}



function processJobElement(jobElement) {

  const nextElement = jobElement.nextSibling;
  if (nextElement?.classList?.contains('visa-status-indicator')) {
    return; // Skip if already has status indicator
  }

  const companyName = jobElement.textContent.split('·')[0].trim();
  
  const statusElement = document.createElement('div');
  statusElement.classList.add('visa-status-indicator');
  
  if (isVisaSponsor(companyName)) {
    statusElement.innerHTML = `<span style="background-color: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px;">${companyName} - Visa Sponsor</span>`;
  } else {
    statusElement.innerHTML = `<span style="background-color: #f44336; color: white; padding: 2px 6px; border-radius: 3px;">${companyName} - Not Visa Sponsor</span>`;
  }
  
  jobElement.parentNode.insertBefore(statusElement, jobElement.nextSibling);
}


