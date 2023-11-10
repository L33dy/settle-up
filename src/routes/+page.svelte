<script>
    import "@picocss/pico/css/pico.min.css"
    import {onMount} from "svelte";
    import {users, payments, whoToWho} from "$lib/stores.js";

    let addingUser = false;
    let addingPayment = false;

    onMount(() => {
        let savedGroup = localStorage.getItem("group")
        let savedPayments = localStorage.getItem("payments")

        if (savedGroup === null) {
            users.set([])
        } else {
            users.set(JSON.parse(savedGroup))
        }

        if (savedPayments === null) {
            payments.set([])
        } else {
            payments.set(JSON.parse(savedPayments))
        }

        calculateDebts()
    })

    function addUser() {
        let userName = document.getElementById("user-name").value

        const user = {
            name: userName
        }

        users.update(oldUsers => [...oldUsers, user])
        users.subscribe(group => localStorage.setItem("group", JSON.stringify(group)))

        addingUser = false;
    }

    function addPayment() {
        let paymentName = document.getElementById("payment-name").value
        let whoPaid = document.getElementById("who-paid").value
        let whom = document.getElementById("whom").value
        let howMuch = document.getElementById("how-much").value
        let groupUsers = [];

        users.subscribe(value => {
            for (let i = 0; i < value.length; i++) {
                let userObj = {
                    name: value[i].name,
                    debt: 0
                }

                groupUsers.push(userObj)
            }
        })

        if (whom === "Všem") {
            let debtSharePerUser = howMuch / groupUsers.length

            groupUsers.forEach(user => {
                user.debt = debtSharePerUser.toFixed(2);
            })
        }

        const payment = {
            name: paymentName,
            whoPaid: whoPaid,
            whom: whom,
            cost: howMuch,
            debtors: groupUsers
        }

        payments.update(oldPayments => [...oldPayments, payment])
        payments.subscribe(payment => localStorage.setItem("payments", JSON.stringify(payment)))

        addingPayment = false;

        location.reload()
    }

    let debts = {}
    let whoOwesToWho = []

    function calculateDebts() {
        payments.subscribe(value => {
            value.forEach(transaction => {
                const payer = transaction.whoPaid;

                if (!debts[payer]) debts[payer] = {};

                transaction.debtors.forEach(debtor => {
                    const to = debtor.name;
                    const amount = parseFloat(debtor.debt);

                    if(payer !== to) {
                        console.log("Processing: " + to + " with amount: " + amount)

                        if (!debts[to]) debts[to] = {};

                        if (!debts[payer][to]) debts[payer][to] = 0;
                        if (!debts[to][payer]) debts[to][payer] = 0;

                        debts[payer][to] += amount;
                        console.log(`From ${to} to ${payer}: ` + debts[payer][to])

                        debts[to][payer] -= amount;
                        console.log(`From ${payer} to ${to}: ` + debts[to][payer])
                        console.log("\n")
                    }
                });
            });

            console.log(debts)

            for (const payer in debts) {
                for (const debtor in debts[payer]) {
                    const amount = debts[payer][debtor];
                    if (amount > 0) {
                        whoOwesToWho.push({ from: debtor, to: payer, amount: amount.toFixed(2) });
                    }
                }
            }
        });

        whoToWho.set(whoOwesToWho)
    }
</script>

<style>
    .buttons {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-direction: row;
        width: 100%;
        gap: 2rem;
    }

    .buttons > a {
        width: 176px;
        white-space: nowrap;
    }
</style>

<main class="container"
      style="padding-top: 5rem; display: flex; justify-content: center; align-items: center; flex-direction: column; gap: 1rem;">
    <div class="buttons">
        {#if $users}
            <a href="#" role="button"
               on:click={() => {addingPayment = !addingPayment}}>{addingPayment ? "Zrušit" : "Přidat platbu"}</a>
        {/if}
        <a href="#" role="button" class="outline"
           on:click={() => {addingUser = !addingUser}}>{addingUser ? "Zrušit" : "Přidat uživatele"}</a>
    </div>

    {#if $users}
        <div class="grid" style="width: 50%; text-align: center">
            {#each $users as user}
                <div>{user.name}</div>
            {/each}
        </div>
    {/if}

    {#if addingUser}
        <form style="padding-top: 3rem;" autocomplete="off">
            <input type="text" id="user-name" placeholder="Název uživatele">
            <button type="button" on:click={addUser}>Přidat uživatele</button>
        </form>
    {/if}

    {#if addingPayment}
        <form style="padding-top: 3rem;" autocomplete="off">
            <input type="text" id="payment-name" placeholder="Název platby">
            <label for="who-paid">Kdo platil?</label>
            <select id="who-paid">
                {#each $users as user}
                    <option value={user.name}>{user.name}</option>
                {/each}
            </select>
            <label for="whom">Komu?</label>
            <select id="whom">
                <option value="Všem" selected>Všem</option>
            </select>
            <input type="number" id="how-much" placeholder="Kolik?">
            <button type="button" on:click={addPayment}>Přidat platbu</button>
        </form>
    {/if}

    <h3>Platby</h3>
    {#if $payments}
        <div class="grid"
             style="width: 75%; text-align: left; display: flex; justify-content: center; align-items: flex-start; flex-direction: row; gap: 5rem;">
            {#each $payments as payment}
                <div>
                    <div>
                        <div>Název: {payment.name}</div>
                        <div>Kdo platil: {payment.whoPaid}</div>
                        <div>Komu: {payment.whom}</div>
                        <div>Kolik: {payment.cost},-</div>
                    </div>
                    <div>
                        {#each payment.debtors as debtor}
                            {#if debtor.name === payment.whoPaid}
                                <div><b>{debtor.name} zaplatil za sebe</b>: {debtor.debt},-</div>
                            {:else}
                                <div><b>{debtor.name} dluží</b>: {debtor.debt},-</div>
                            {/if}
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    <h3 style="padding-top: 2rem;">Dluhy</h3>
    <div class="grid"
         style="width: 75%; text-align: left; display: flex; justify-content: center; align-items: flex-start; flex-direction: row; gap: 5rem;">
        <!--{#each whoToWho as w}
            <div>{w.from} -> {w.to} = {w.amount}</div>
        {/each}-->
        {#if $whoToWho}
            {#each $whoToWho as w}
                <div>{w.from} -> {w.to} = {w.amount},-</div>
            {/each}
        {/if}
    </div>
</main>
