<script>
  let counter = 0;
  const inc = () => counter++;
  const dec = () => counter--;
</script>

<button on:click={dec}>dec</button>
{counter}
<button on:click={inc}>inc</button>
