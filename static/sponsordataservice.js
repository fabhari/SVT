const sleep = (min, max) => {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`Sleeping for ${ms/1000} seconds`);
    return new Promise(resolve => setTimeout(resolve, ms));
  };

class SponsorDataService {
    constructor() {
      this.baseUrl = 'https://uktiersponsors.co.uk/tierApi/api';
      this.batchSize = 5;
    }
  
    async getTotalSponsors() {
      try {
        const response = await fetch(`${this.baseUrl}/tierData/Count`);
        return await response.text();
      } catch (error) {
        console.error('Error fetching total count:', error);
        throw error;
      }
    }
  
    async fetchCompaniesPage(pageNumber) {
      try {
        const response = await fetch(`${this.baseUrl}/tierData/Companies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            PageNumber: pageNumber,
            RowsPerPage: 20,
            Company: "",
            Town: "",
            Industry: "",
            SortBy: 0
          })
        });
        return await response.json();
      } catch (error) {
        console.log(`Error fetching page ${pageNumber}:`, error);
        throw error;
      }
    }
  
    async saveToStorage(companies) {
      try {
        await chrome.storage.local.set({
          'sponsorCompanies': companies,
          'lastUpdated': new Date().toISOString()
        });
        console.log('Companies saved to storage:', companies.length);
      } catch (error) {
        console.log('Error saving to storage:', error);
        throw error;
      }
    }
  
    async getAllCompanies() {
      try {
        // Get total count
        const totalCount = await this.getTotalSponsors();
        const totalPages = Math.ceil(totalCount / 20);
        console.log(`Total pages to fetch: ${totalPages}`);
  
        let allCompanies = [];
        
        // Process in batches
        for (let i = 0; i < 1; i += this.batchSize) {
          const pagePromises = [];
          
          // Create batch of promises
          for (let j = 0; j < this.batchSize && (i + j) < totalPages; j++) {
            const pageNumber = i + j;
            await sleep(1000, 2000);
            pagePromises.push(this.fetchCompaniesPage(pageNumber));
          }
  
          // Wait for batch to complete
          console.log(`Fetching pages ${i} to ${i + pagePromises.length - 1}`);
          const results = await Promise.all(pagePromises);
          
          // Append results
          results.forEach(result => {
            if (result && result?.companies && Array.isArray(result?.companies)) {
                allCompanies = [...allCompanies, ...result.companies];
              }
          });
  
          console.log("allCompanies",allCompanies.length);
          // Save intermediate results to storage
          await this.saveToStorage(allCompanies);
  
          // Optional: Add small delay between batches
          await new Promise(resolve => setTimeout(resolve, 100));
        }
  
        return allCompanies;
      } catch (error) {
        console.log('Error fetching all companies:', error);
        throw error;
      }
    }
  }
  

  
  export default SponsorDataService;