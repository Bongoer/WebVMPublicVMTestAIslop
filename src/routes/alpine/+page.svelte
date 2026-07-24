<script>
  import WebVM from '$lib/WebVM.svelte';
  import * as configObj from '/config_alpine';
</script>

<svelte:head>
  <title>XFCE Linux WebVM</title>
  <meta
    name="description"
    content="An independent Alpine Linux XFCE virtual machine running in your browser."
  />
</svelte:head>

<WebVM configObj={configObj} cacheId="blocks_xfce">
  <p>
    This XFCE Linux machine runs locally in your browser. Each visitor gets a
    separate virtual machine.
  </p>
</WebVM>
