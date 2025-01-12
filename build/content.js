
let trie = null;
let linkedinParser = null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function isVisaSponsor(companyName) {
  const data = trie?.findSuggestions(companyName);
  console.log(data)
  return data.length > 0;
}
// tAwuDyPkXRFipemrPiTUbCCSWPlFqctmjJVaM

//------------ Linkedin Parser ------------
class LinkedinParser{
  constructor(){
    this.data = [];
    this.linkedinJobContainer = 'scaffold-layout__list ';
    this.linkedinJobPostingClass = 'artdeco-entity-lockup__subtitle';
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


//--Tree Data Structure--
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.companyName = null;
    this.originalCompanyName = null;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise(async (resolve, reject) => {
      try {
        await this.loadCompaniesFromFile();
        this.isInitialized = true;
        console.log('Trie initialized with company data');
        resolve(true);
      } catch (error) {
        console.error('Failed to initialize Trie:', error);
        reject(error);
      }
    });

    return this.initializationPromise;
  }

  async loadCompaniesFromFile() {
    try {
      const fileUrl = chrome.runtime.getURL('data.txt');
      const response = await fetch(fileUrl);
      const text = await response.text();
      
      const companies = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

        companies.forEach(company => {
            this.insert(company.toLowerCase(), company);
            if (company.includes(' ')) {
            const noSpaces = company.replace(/\s+/g, '');
            this.insert(noSpaces.toLowerCase(), company);
          }
        });
      console.log(`Loaded ${companies.length} companies`);
    } catch (error) {
      console.error('Error loading companies:', error);
      throw error;
    }
  }

  insert(companyName, originalCompanyName) {
    let node = this.root;
    for (const char of companyName) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.companyName = companyName;
    node.originalCompanyName = originalCompanyName;
  }

  findSuggestions(prefix, limit = 3) {
    if (!this.isInitialized) {
      throw new Error('Trie not initialized');
    }

    prefix = prefix.toLowerCase().trim();
    if (prefix.length < 2) return [];

    // Find the node for the prefix
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) {
        return [];
      }
      node = node.children[char];
    }

    // Collect suggestions starting from this node
    const suggestions = [];
    this.collectSuggestions(node, suggestions, limit);
    return suggestions;
  }

  collectSuggestions(node, suggestions, limit) {
    if (suggestions.length >= limit) return;

    if (node.isEndOfWord) {
      suggestions.push(node.originalCompanyName);
    }

    for (const char in node.children) {
      if (suggestions.length >= limit) break;
      this.collectSuggestions(node.children[char], suggestions, limit);
    }
  }
}


//------------ Actual Code ------------

(async ()=>{

  trie = new Trie();
  linkedinParser = new LinkedinParser();

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

  try 
  {
    await trie.initialize(); 
  } catch (error) 
  {
    console.log('Error:', error);
  }
})();