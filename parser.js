// Parser.js
import { Trie } from "./trie.js";

class Parser {
  constructor() {
    if (Parser.instance) {
      return Parser.instance;
    }

    this.trie = new Trie();
    Parser.instance = this;
  }

  getTrie = () => {
    return this.trie;
  };
}

const trieInstance = new Parser();
Object.freeze(trieInstance);
export default trieInstance;
