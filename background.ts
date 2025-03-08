
import SponsorDataService from './SponsorDataService.js';

setTimeout(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Error setting side panel behavior:', error));
}, 100);
  
  try
  {
 
    const sponsorService = new SponsorDataService();

    const ALLOWED_DOMAINS = [
      'www.linkedin.com',
      'linkedin.com',
      'www.indeed.com',
      'indeed.com',
      'uk.indeed.com',
      'www.glassdoor.com',
      'glassdoor.com',
      'www.monster.com',
      'monster.com'
      // Add more job sites as needed
    ];
    const JobSite = {
      LInkedin : 1,
      Glassdoor : 2,
      Monster : 3,
      Indeed : 4
    }
    const LinkedinJobsCollectionPage = 'https://www.linkedin.com/jobs/';
  
    // Keep track of processed URLs
    let processedTabs = new Map();
  
    function shouldProcessTab(tabId, url) {
      const currentState = processedTabs.get(tabId);
      if (currentState === url) {
        return false; 
      }
      processedTabs.set(tabId, url);
      return true;
    }
  
    function isAllowedDomain(url) {
      try {
        const hostname = new URL(url).hostname;
        return ALLOWED_DOMAINS.some(domain => hostname === domain);
      } catch {
        return false;
      }
    }
  
  
    async function sendMessageToTab(tabId, message) {
      if (!shouldProcessTab(tabId, message.url)) {
        console.log('Skip duplicate processing for:', message.url);
        return;
      }
      try {
        await chrome.tabs.sendMessage(tabId, message);
      } catch (error) {
        chrome.tabs.onUpdated.addListener(function listener(id, info) {
          if (id === tabId && info.status === 'complete') {
            chrome.tabs.sendMessage(tabId, message);
            chrome.tabs.onUpdated.removeListener(listener);
          }
        });
      }
    }
    // Fix the tabs query
    chrome.tabs.query({}, function(tabs) {
      tabs?.forEach(async (tab) => {
        if (tab.url && isAllowedDomain(tab.url)) {
  
          if (tab.url.startsWith(LinkedinJobsCollectionPage)) {
            await sendMessageToTab(tab.id, {
              jobSite: JobSite.LInkedin,
              action: 'PARSE_JOBS',
              url: tab.url
            });
          }
        } 
      });
    });
  
    // ... rest of your onUpdated listener code ...
  
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.url) {
        if (isAllowedDomain(tab.url)) {
  
          if (tab.url.startsWith(LinkedinJobsCollectionPage)) {
            await sendMessageToTab(tab.id, {
              jobSite: JobSite.LInkedin,
              action: 'PARSE_JOBS',
              url: tab.url
            });
          }
        } 
      }
    });
  
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      if (message.action === "COMPANY_NAME") {
        console.log("Company name received:", message.data);
        getCompaniesFromStorage(message?.data)
      }
    });


      
    // Initialize download check
    async function downloadSponsors() {
      try {  
        sponsorService.getAllCompanies();
      }
      catch(e){
        console.log(e)
      }
    }
  
    async function getCompaniesFromStorage(CompanyName) {

      const companyName = CompanyName; 

      try {
          const storedCompanyData = await chrome.storage.local.get([companyName]);
          if (storedCompanyData[companyName]) {
              console.log("Company data retrieved from storage:", storedCompanyData[companyName]);
              return storedCompanyData[companyName];
          } else {
              const fetchedCompanyData = await sponsorService.fetchCompanyData(companyName);
              console.log("Company data not found in storage, fetching from API...",fetchedCompanyData);
              await sponsorService.itrCompanyDataSaveStorage(fetchedCompanyData);
          }
      } catch (error) {
          console.log("Error retrieving or fetching company data:", error);
      }
    }
  
    async function refreshTabs(){
      try {
        const tabs = await chrome.tabs.query({});
        console.log('Refreshing LinkedIn tab:',tabs);
        for (const tab of tabs) {
          try {
            if (tab.url?.includes('linkedin.com')) {
              console.log('Refreshing LinkedIn tab:', tab.id);
              await chrome.tabs.reload(tab.id ,{ bypassCache: true });
            }
          } catch (tabError) {
            console.log('Error processing tab:', tab.id, tabError);
          }
        }
      } catch (error) {
        console.log('Error during startup refresh:', error);
      }
    }
  
    chrome.runtime.onStartup.addListener(async () => {
      refreshTabs();
    });
    
  
    // Set up daily update
    chrome.runtime.onInstalled.addListener(() => {
      console.log("am being installed")
      refreshTabs();
      downloadSponsors();
      chrome.alarms.create('updateSponsors', {
        periodInMinutes: 60 * 5 // 24 hours
      });
    });
    
    // Listen for alarm
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'updateSponsors') {
        console.log("Alarm triggered")
        downloadSponsors();
      }
    });
  
  
  }
  catch(e)
  {
    console.log(e)
  }
  
  
  // // To read from storage in content script:
  // async function getCompaniesFromStorage() {
  //   try {
  //     const data = await chrome.storage.local.get(['sponsorCompanies', 'lastUpdated']);
  //     return {
  //       companies: data.sponsorCompanies || [],
  //       lastUpdated: data.lastUpdated
  //     };
  //   } catch (error) {
  //     console.error('Error reading from storage:', error);
  //     return { companies: [], lastUpdated: null };
  //   }
  // }
  
  
    // Check if update is needed
    // async function checkForUpdate() {
    //   const data = await chrome.storage.local.get(['lastUpdated']);
    //   const lastUpdated = new Date(data.lastUpdated || 0);
    //   const now = new Date();
      
    //   // If more than 24 hours have passed since last update
    //   if (now - lastUpdated > 24 * 60 * 60 * 1000) {
    //     const sponsorService = new SponsorDataService();
    //     await sponsorService.getAllCompanies();
    //   }
    // }
    
//   // //console.log(tab.url)
//       if (changeInfo.status === 'complete' && tab.url.includes('/screen/welcomescreen')) {
//         chrome.tabs.remove(tabId, () => {
//           //console.log(`Closed tab with ID: ${tabId} as it matched the URL condition.`);
//         });
//       }
//     });

    // chrome.runtime.onStartup.addListener(() => {
    //   chrome.tabs.query({}, (tabs) => {
    //     tabs.forEach((tab) => {
    //       if (tab.url.includes('/screen/welcomescreen')) {
    //         chrome.tabs.remove(tab.id, () => {
    //           //console.log(`Closed tab with ID: ${tab.id} on startup as it matched the URL condition.`);
    //         });
    //       }
    //     });
    //   });
    // });


