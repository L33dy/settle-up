<script>
    import "@picocss/pico/css/pico.min.css"
    import {onMount} from "svelte";
    import {users} from "$lib/stores.js";
    import {enhance} from "$app/forms";

    let addingUser = false;
</script>

<main class="container" style="padding-top: 5rem; display: flex; justify-content: center; align-items: center; flex-direction: column; gap: 1rem;">
    <a href="#" role="button" class="outline" on:click={() => {addingUser = !addingUser}} style="align-self: flex-end;">Přidat uživatele</a>
    {#if addingUser}
        <form action="?/addUser" method="post" use:enhance>
            <input type="text" name="user-name" placeholder="Název uživatele">
            <button>Přidat</button>
        </form>
    {/if}
    <p>{$users}</p>
</main>
