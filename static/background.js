import SponsorDataService from './SponsorDataService.js';

try
{
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
        await chrome.sidePanel.setOptions({
          tabId: tab.id,
          path: 'index.html',
          enabled: true
        });

        if (tab.url.startsWith(LinkedinJobsCollectionPage)) {
          await sendMessageToTab(tab.id, {
            jobSite: JobSite.LInkedin,
            action: 'PARSE_JOBS',
            url: tab.url
          });
        }
      } else {
        await chrome.sidePanel.setOptions({
          tabId: tab.id,
          enabled: false
        });
      }
    });
  });

  // ... rest of your onUpdated listener code ...

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      if (isAllowedDomain(tab.url)) {
        await chrome.sidePanel.setOptions({
          tabId,
          path: 'index.html',
          enabled: true
        });

        if (tab.url.startsWith(LinkedinJobsCollectionPage)) {
          await sendMessageToTab(tab.id, {
            jobSite: JobSite.LInkedin,
            action: 'PARSE_JOBS',
            url: tab.url
          });
        }
      } else {
        await chrome.sidePanel.setOptions({
          tabId,
          enabled: false
        });
      }
    }
  });


  // Initialize download check
  async function downloadSponsors() {
    try {
      const sponsorService = new SponsorDataService();
      sponsorService.getAllCompanies();
    }
    catch(e){
      console.log(e)
    }
  }

  // Listen for Chrome startup
  // chrome.runtime.onStartup.addListener(() => {
  //   console.log('Chrome started');
  //   //downloadSponsors();
  // });


  // Set up daily update
  chrome.runtime.onInstalled.addListener(() => {
    console.log("am being installed")
   // downloadSponsors();
    chrome.alarms.create('updateSponsors', {
      periodInMinutes: 60 * 5 // 24 hours
    });
  });
  
  // Listen for alarm
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateSponsors') {
      console.log("Alarm triggered")
      // const sponsorService = new SponsorDataService();
      // sponsorService.getAllCompanies();
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
  