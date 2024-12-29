class TrieNode {
    constructor() {
        this.children = {}; // Stores child nodes
        this.isEndOfWord = false; // Marks the end of a valid word
        this.companyName = null; // Stores the full company name at leaf nodes
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    // Insert a company name into the Trie
    insert(companyName) {
        let node = this.root;
        for (const char of companyName.toLowerCase()) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        node.isEndOfWord = true;
        node.companyName = companyName;
    }

    // Search for the closest match based on a prefix
    searchPrefix(prefix) {
        let node = this.root;
        for (const char of prefix.toLowerCase()) {
            if (!node.children[char]) {
                return []; // Prefix not found
            }
            node = node.children[char];
        }
        return this.collectAllWords(node);
    }

    // Collect all words under a Trie node
    collectAllWords(node, words = []) {
        if (node.isEndOfWord) {
            words.push(node.companyName);
        }
        for (const char in node.children) {
            this.collectAllWords(node.children[char], words);
        }
        return words;
    }

    // Find the best match using a simple similarity score
    findBestMatch(inputName) {
        const candidates = this.searchPrefix(inputName.slice(0, 2)); // Narrow down by prefix
        if (!candidates.length) return null;

        let bestMatches = [];
        let bestScore = 0;

        candidates.forEach(candidate => {
            const score = calculateSimilarity(inputName, candidate);
            if (score > bestScore) {
                bestScore = score;
                bestMatches = [candidate];
            } else if (score === bestScore) {
                bestMatches.push(candidate);
            }
        });

        return bestMatches;
    }
}

// Helper: Calculate similarity (Levenshtein-based for simplicity)
function calculateSimilarity(s1, s2) {
    const edits = (a, b) => {
        const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
        for (let i = 0; i <= a.length; i++) dp[i][0] = i;
        for (let j = 0; j <= b.length; j++) dp[0][j] = j;

        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                if (a[i - 1] === b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
                }
            }
        }
        return dp[a.length][b.length];
    };

    const distance = edits(s1.toLowerCase(), s2.toLowerCase());
    return 1 - distance / Math.max(s1.length, s2.length);
}


export default Trie; 
