export class TrieNode {
  constructor() {
    this.children = {}
    this.isEndOfWord = false
    this.companyName = null
    this.originalCompanyName = null
  }
}

export class Trie {
  constructor() {
    this.root = new TrieNode()
    this.isInitialized = false
    this.initializationPromise = null
  }

  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = new Promise(async (resolve, reject) => {
      try {
        await this.loadCompaniesFromFile()
        this.isInitialized = true
        console.log("Trie initialized with company data")
        resolve(true)
      } catch (error) {
        console.error("Failed to initialize Trie:", error)
        reject(error)
      }
    })

    return this.initializationPromise
  }

  async loadCompaniesFromFile() {
    try {
      const fileUrl = chrome.runtime.getURL("data.txt")
      const response = await fetch(fileUrl)
      const text = await response.text()

      const companies = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      companies.forEach((company) => {
        this.insert(company.toLowerCase(), company)
        if (company.includes(" ")) {
          const noSpaces = company.replace(/\s+/g, "")
          this.insert(noSpaces.toLowerCase(), company)
        }
      })
      console.log(`Loaded ${companies.length} companies`)
    } catch (error) {
      console.error("Error loading companies:", error)
      throw error
    }
  }

  insert(companyName, originalCompanyName) {
    let node = this.root
    for (const char of companyName) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode()
      }
      node = node.children[char]
    }
    node.isEndOfWord = true
    node.companyName = companyName
    node.originalCompanyName = originalCompanyName
  }

  findSuggestions(prefix, limit = 3) {
    if (!this.isInitialized) {
      throw new Error("Trie not initialized")
    }

    prefix = prefix.toLowerCase().trim()
    if (prefix.length < 2) return []

    // Find the node for the prefix
    let node = this.root
    for (const char of prefix) {
      if (!node.children[char]) {
        return []
      }
      node = node.children[char]
    }

    // Collect suggestions starting from this node
    const suggestions = []
    this.collectSuggestions(node, suggestions, limit)
    return suggestions
  }

  collectSuggestions(node, suggestions, limit) {
    if (suggestions.length >= limit) return

    if (node.isEndOfWord) {
      suggestions.push(node.originalCompanyName)
    }

    for (const char in node.children) {
      if (suggestions.length >= limit) break
      this.collectSuggestions(node.children[char], suggestions, limit)
    }
  }
}
