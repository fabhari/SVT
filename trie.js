export class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.companyName = null;
    this.originalCompanyName = null;
    this.data = null;
  }
}

export class Trie {
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
        console.log("Trie initialized with company data");
        resolve(true);
      } catch (error) {
        console.error("Failed to initialize Trie:", error);
        reject(error);
      }
    });

    return this.initializationPromise;
  }

  // async loadCompaniesFromFile() {
  //   try {
  //     const fileUrl = chrome.runtime.getURL("companies.csv");
  //     console.log("fileUrl", fileUrl);
  //     const response = await fetch(fileUrl);
  //     const text = await response.text();

  //     // Parse the CSV data
  //     const rows = text.split("\n").map((line) => line.trim());
  //     const headers = rows[0].split(","); // Assuming tab-separated CSV
  //     const data = rows.slice(1);

  //     //--------
  //     // Convert CSV rows to JSON objects
  //     data.forEach((row) => {
  //       const columns = row.split(",");
  //       const company = {};

  //       headers.forEach((header, index) => {
  //         company[header] = columns[index];
  //       });

  //       // console.log("company", company);
  //       const companyName = company.organisationName;

  //       this.insert(companyName.toLowerCase(), company);
  //       if (companyName.includes(" ")) {
  //         const noSpaces = companyName.replace(/\s+/g, "");
  //         this.insert(noSpaces.toLowerCase(), company);
  //       }
  //     });
  //     //-----------
  //     console.log(`Loaded ${data.length} companies`);
  //   } catch (error) {
  //     console.error("Error loading companies:", error);
  //     throw error;
  //   }
  // }

  async loadCompaniesFromFile() {
    const maxRetries = 10; // Maximum number of retries
    const retryDelay = 1000; // Delay between retries in milliseconds (1 second)

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const fileUrl = chrome.runtime.getURL("companies.csv");
        console.log("Attempt", attempt, "Loading file from:", fileUrl);

        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }

        const text = await response.text();

        // Parse the CSV data
        const rows = text.split("\n").map((line) => line.trim());
        const headers = rows[0].split(","); // Assuming comma-separated CSV
        const data = rows.slice(1);

        // Convert CSV rows to JSON objects
        data.forEach((row) => {
          const columns = row.split(",");
          const company = {};

          headers.forEach((header, index) => {
            company[header] = columns[index];
          });

          const companyName = company.organisationName;

          this.insert(companyName.toLowerCase(), company);
          if (companyName.includes(" ")) {
            const noSpaces = companyName.replace(/\s+/g, "");
            this.insert(noSpaces.toLowerCase(), company);
          }
        });

        console.log(`Loaded ${data.length} companies`);
        return; // Exit the function on success
      } catch (error) {
        // console.error(`Attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          // If all retries failed, throw the error
          // throw new Error(`Failed to load companies after ${maxRetries} attempts: ${error.message}`);
        }
        // Wait for the retry delay before trying again
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }
  insert(companyName, companyData) {
    let node = this.root;
    for (const char of companyName) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.companyName = companyName;
    node.originalCompanyName = companyData?.organisationName;
    node.data = companyData;
  }

  findSuggestions(prefix, limit = 3) {
    if (!this.isInitialized) {
      throw new Error("Trie not initialized");
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
      suggestions.push(node.data);
    }

    for (const char in node.children) {
      if (suggestions.length >= limit) break;
      this.collectSuggestions(node.children[char], suggestions, limit);
    }
  }
}
