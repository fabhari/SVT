import { Trie } from "./trie.js"

let trie = new Trie()

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let payload = { action: "COMPANY_NAME", data: "" }

const sendCompanyName = (companyName) => {
  // return new Promise((resolve, reject) => {
  console.log("sending Company Name to background script", companyName)
  payload.data = companyName
  chrome.runtime.sendMessage(payload, (response) => {
    if (response) {
      console.log("Response from background script:", response)
    } else {
      console.log("No response from background script.")
    }
  })
  // })
}

function isVisaSponsor(companyName) {
  const data = trie?.findSuggestions(companyName)
  sendCompanyName(companyName)
  console.log(data)
  return data.length > 0
}

export class LinkedinParser {
  constructor() {
    this.data = []
    this.linkedinJobContainer = "scaffold-layout__list "
    this.linkedinJobPostingClass = "artdeco-entity-lockup__subtitle"
    try {
      trie.initialize()
    } catch (error) {
      console.log("Error:", error)
    }
  }

  async setupJobContainerObserver() {
    await sleep(2000)
    const jobContainer = document.querySelector(`.${this.linkedinJobContainer}`)
    if (!jobContainer) {
      console.log("Job container not found, will retry...")
      return false
    }

    const existingJobs = jobContainer.querySelectorAll(
      `.${this.linkedinJobPostingClass}`
    )
    existingJobs.forEach((jobElement) => {
      this.processJobElement(jobElement)
    })

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const jobElement = node.querySelector(
              `.${this.linkedinJobPostingClass}`
            )
            if (jobElement) {
              this.processJobElement(jobElement)
            }
          }
        })
      })
    })

    observer.observe(jobContainer, {
      childList: true,
      subtree: true,
      attributes: true
    })

    return true
  }

  processJobElement(jobElement) {
    const nextElement = jobElement.nextSibling
    if (nextElement?.classList?.contains("visa-status-indicator")) {
      return
    }
    const companyName = jobElement.textContent.split("·")[0].trim()
    const statusElement = document.createElement("div")
    statusElement.classList.add("visa-status-indicator")

    if (isVisaSponsor(companyName)) {
      statusElement.innerHTML = `<span style="background-color: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px;">${companyName} - Visa Sponsor</span>`
    } else {
      statusElement.innerHTML = `<span style="background-color: #f44336; color: white; padding: 2px 6px; border-radius: 3px;">${companyName} - Not Visa Sponsor</span>`
    }

    jobElement.parentNode.insertBefore(statusElement, jobElement.nextSibling)
  }
}
