
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function isVisaSponsor(companyName) {
  const sponsorList = ['Company A', 'Company B']; 
  return sponsorList.includes(companyName);
}


//------------ Linkedin Parser ------------
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


//--Tree Data Structure--

class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.companyName = null;
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
      // Get the URL for your data file
      const fileUrl = chrome.runtime.getURL('data.txt');
      console.log('Loading companies from:', fileUrl);
      
      // Fetch and read the file
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      
      // Parse and insert each company
      const companies = text
        .split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(line => line.length > 0);

      if (companies.length === 0) {
        throw new Error('No companies found in file');
      }

      companies.forEach(company => this.insert(company));
      console.log(`Loaded ${companies.length} companies into Trie`);
      
      // Verify data was loaded
      const sampleSearch = this.searchPrefix('a');
      console.log('Sample search result count:', sampleSearch.length);
      
    } catch (error) {
      console.error('Error loading companies:', error);
      throw error;
    }
  }

  insert(companyName) {
    let node = this.root;
    for (const char of companyName) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.companyName = companyName;
  }

  searchPrefix(prefix) {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children[char]) {
        return [];
      }
      node = node.children[char];
    }
    return this.collectAllWords(node);
  }

  collectAllWords(node, words = []) {
    if (node.isEndOfWord) {
      words.push(node.companyName);
    }
    for (const char in node.children) {
      this.collectAllWords(node.children[char], words);
    }
    return words;
  }

  findBestMatches(inputName, maxResults = 5) {
    if (!this.isInitialized) {
      throw new Error('Trie not initialized. Call initialize() first');
    }

    try {
      const prefix = inputName.slice(0, 2).toLowerCase();
      const candidates = this.searchPrefix(prefix);
      console.log("Candidates found:", candidates.length);
      
      if (candidates.length === 0) {
        return [];
      }

      const matches = [];
      for (const candidate of candidates) {
        const score = this.calculateSimilarity(inputName, candidate);
        if (score > 0.5) {
          matches.push({ name: candidate, score });
        }
      }

      matches.sort((a, b) => b.score - a.score);
      console.log("Matches found:", matches.length);
      return matches.slice(0, maxResults);
    } catch (error) {
      console.error('Error in findBestMatches:', error);
      return [];
    }
  }

  calculateSimilarity(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    
    if (s1 === s2) return 1.0;
    
    const len1 = s1.length;
    const len2 = s2.length;
    const maxDist = Math.floor(Math.max(len1, len2) / 2) - 1;
    let matches = 0;
    
    const hash1 = new Array(len1).fill(0);
    const hash2 = new Array(len2).fill(0);
    
    for (let i = 0; i < len1; i++) {
      for (let j = Math.max(0, i - maxDist); 
           j < Math.min(len2, i + maxDist + 1); j++) {
        if (s1[i] === s2[j] && !hash2[j]) {
          hash1[i] = 1;
          hash2[j] = 1;
          matches++;
          break;
        }
      }
    }
    
    if (matches === 0) return 0.0;
    
    let transpositions = 0;
    let point = 0;
    
    for (let i = 0; i < len1; i++) {
      if (hash1[i]) {
        while (!hash2[point]) point++;
        if (s1[i] !== s2[point]) transpositions++;
        point++;
      }
    }
    
    return (matches / len1 + matches / len2 + 
            (matches - transpositions / 2) / matches) / 3.0;
  }
}


//------------ Actual Code ------------
(async ()=>{
  try {
    const trie = new Trie();
    await trie.initialize(); // Wait for initialization to complete
    
    // Now safe to search
    const matches = trie.findBestMatches('google');
    console.log('Search results:', matches);
  } catch (error) {
    console.error('Error:', error);
  }
})();



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
