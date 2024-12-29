<script>


  import GoogleAuth from "./GoogleAuth.svelte";

  const onAuthCallback = (data)=>{
    console.log("Auth", data);
  }
</script>

  <GoogleAuth onAuth={onAuthCallback}/>