<script>
    import { onMount } from 'svelte';
  
     /** @type {(data: any) => void} */
     export let onAuth;

    function decodeJwtResponse(token) {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
  
      return JSON.parse(jsonPayload);
    }
  
    function handleCredentialResponse(response) {
      const responsePayload = decodeJwtResponse(response.credential);
       onAuth({
        id: responsePayload.sub,
        fullName: responsePayload.name,
        givenName: responsePayload.given_name,
        familyName: responsePayload.family_name,
        imageUrl: responsePayload.picture,
        email: responsePayload.email,
        token: response.credential
      });
    }
  
    onMount(() => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.referrerpolicy="strict-origin-when-cross-origin";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        google.accounts.id.initialize({
          client_id:'174127631781-r8ueio9u66m8vj0acdp61o7l4dn60dn2.apps.googleusercontent.com',
          callback: handleCredentialResponse
        });
        google.accounts.id.renderButton(
          document.getElementById('googleSignIn'),
          { theme: 'outline', size: 'large', text: "signin_with", shape: "rectangular", logo_alignment: "left" }
        );
        google.accounts.id.prompt(); 
      };
      document.body.appendChild(script);
    });
  </script>
  
  <div id="googleSignIn"></div>