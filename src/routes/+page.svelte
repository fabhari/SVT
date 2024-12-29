<script>
  import Authentication from "$lib/Components/GoogleAuth.svelte";
  import LoginScreen from "$lib/Components/LoginScreen.svelte";
  import WelcomeScreen from "$lib/Components/WelcomeScreen.svelte";
  import "carbon-components-svelte/css/all.css";
  import { onMount } from "svelte";

  
  onMount(() => {
    // Listen for messages from background
    chrome.runtime.onMessage.addListener((message) => {
      switch (message.type) {
        case 'JOB_DETECTED':
          console.log('New job detected:', message.data);
          break;
      }
    });
  });

  // Send message to background
  function sendToBackground(message) {
    chrome.runtime.sendMessage(message, (response) => {
      console.log('Response:', response);
    });
  }
</script>

<!-- <LoginScreen/> -->
<WelcomeScreen/>

<style>
  @import url("https://fonts.googleapis.com/css?family=Muli:200");

</style>

