
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function isVisaSponsor(companyName) {
  const sponsorList = ['Company A', 'Company B']; 
  return sponsorList.includes(companyName);
}

class LinkedinParser{
  constructor(){
    this.data = [];
    this.linkedinJobContainer = 'rjmNTMLkNvPwnJnFTCybgSFpgYGQ';
    this.linkedinJobPostingClass = 'qWfdXzyeXDuRARonfVAolXAIekneWwGdBuiY';
  }

  async setupJobContainerObserver() {
    await sleep(2000);
    const jobContainer = document.querySelector(`.${this.linkedinJobContainer}`);
    if (!jobContainer) {
      console.log('Job container not found, will retry...');
      return false;
    }
  
    const existingJobs = jobContainer.querySelectorAll(`.${this.linkedinJobPostingClass}`);
    existingJobs.forEach(jobElement => {
      this.processJobElement(jobElement);
    });
  
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const jobElement = node.querySelector(`.${this.linkedinJobPostingClass}`);
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
      attributes: true
    });
  
    return true;
  }
  
  processJobElement(jobElement) {

    const nextElement = jobElement.nextSibling;
    if (nextElement?.classList?.contains('visa-status-indicator')) {
      return; 
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
}







//------------ Actual Code ------------
const linkedinParser = new LinkedinParser();
// Send message to background
const JobSite = {
  LInkedin : 1,
  Glassdoor : 2,
  Monster : 3,
  Indeed : 4
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Start Linkedin Parsing...");
  if (message.action === 'PARSE_JOBS') {
    console.log("PARSE_JOBS");
    linkedinParser.setupJobContainerObserver(); 
  }
});
