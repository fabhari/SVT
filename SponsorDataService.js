const SPONSOR_LIST_COUNT = 113922
const sleep = (min, max) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min
  console.log(`Sleeping for ${ms / 1000} seconds`)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class SponsorDataService {
  constructor() {
    this.baseUrl = "https://uktiersponsors.co.uk/tierApi/api"
    this.batchSize = 5
  }

  async setPageNumber(num) {
    return chrome.storage.local.set({ page_num: num }) // Use array for key
  }

  async getPageNumber() {
    const { page_num } = await chrome.storage.local.get(["page_num"]) // Use array for key
    return page_num || 0 // Return 0 if page_num is undefined
  }

  async getTotalSponsors() {
    try {
      const response = await fetch(`${this.baseUrl}/tierData/Count`)
      return await response.text()
    } catch (error) {
      console.log("Error fetching total count:", error)
      return Promise.resolve(SPONSOR_LIST_COUNT)
    }
  }

  async fetchCompanyData(companyName) {
    try {
      const response = await fetch(`${this.baseUrl}/tierData/Companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          Company: companyName,
          Industry: "",
          PageNumber: 0,
          RowsPerPage: 10,
          SortBy: 0,
          Town: ""
        })
      })
      let data = await response.json()
      if (data?.companies) {
        return data.companies
      }
      return []
    } catch (error) {
      console.log(`Error fetching company ${companyName}:`, error)
      return []
    }
  }

  async fetchCompaniesPage(pageNumber) {
    try {
      const response = await fetch(`${this.baseUrl}/tierData/Companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          PageNumber: pageNumber,
          RowsPerPage: 20,
          Company: "",
          Town: "",
          Industry: "",
          SortBy: 0
        })
      })
      let data = await response.json()
      if (data?.companies) {
        return data.companies
      }
      return []
    } catch (error) {
      console.log(`Error fetching page ${pageNumber}:`, error)
      return []
    }
  }

  async setCompanies(companyName, companyData) {
    return chrome.storage.local.set({ [companyName]: companyData }) // Use array for key
  }

  async itrCompanyDataSaveStorage(data) {
    if (data != []) {
      data.forEach(async (companyData) => {
        if (companyData?.organisationName?.length > 0) {
          await this.setCompanies(companyData?.organisationName, companyData)
        }
      })
    }
  }
  async getAllCompanies() {
    try {
      // Get total count
      const totalCount = await this.getTotalSponsors()
      const totalPages = Math.ceil(totalCount / 20)
      console.log(`Total pages to fetch: ${totalPages}`)

      const pageNum = await this.getPageNumber()
      // Process in batches
      for (let num = pageNum; num < totalPages; num++) {
        await this.setPageNumber(num)
        let data = await this.fetchCompaniesPage(num)
        this.itrCompanyDataSaveStorage(data)
        await sleep(10000, 10000)
      }
    } catch (error) {
      console.log("Error fetching all companies:", error)
      throw error
    }
  }
}

export default SponsorDataService
