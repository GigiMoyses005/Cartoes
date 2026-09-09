/* =====================================================
CONTROLE DE CARTÕES
Versão 1 - LocalStorage

Estrutura preparada para futura migração para Firebase.
===================================================== */

/* =====================================================
BANCO LOCAL
===================================================== */

let cards = loadData("cards");
let people = loadData("people");
let purchases = loadData("purchases");

let monthlyChart = null;

/* =====================================================
INICIALIZAÇÃO
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

initializeDate();

initializeNavigation();

initializeForms();

initializeFilters();

initializeDashboardFilters();

initializePurchasePreview();

setDefaultDates();

renderAll();

});

/* =====================================================
LOCAL STORAGE
===================================================== */

function loadData(key) {

try {

    return JSON.parse(
        localStorage.getItem(key)
    ) || [];

} catch (error) {

    console.error(
        `Erro ao carregar ${key}:`,
        error
    );

    return [];

}

}

function saveData(key, data) {

localStorage.setItem(
    key,
    JSON.stringify(data)
);

}

/* =====================================================
NAVEGAÇÃO
===================================================== */

function initializeNavigation() {

document
    .querySelectorAll(".menu-item[data-page]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                changePage(
                    button.dataset.page
                );

            }
        );

    });


document
    .getElementById("themeButton")
    .addEventListener(
        "click",
        toggleTheme
    );

}

function changePage(page) {

document
    .querySelectorAll(".page")
    .forEach(section => {

        section.classList.remove(
            "active-page"
        );

    });


const selectedPage =
    document.getElementById(page);


if (!selectedPage) return;


selectedPage.classList.add(
    "active-page"
);


document
    .querySelectorAll(
        ".menu-item[data-page]"
    )
    .forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === page
        );

    });


const titles = {

    dashboard: "Dashboard",
    cards: "Cartões",
    purchases: "Compras",
    people: "Pessoas",
    invoices: "Faturas",
    reports: "Relatórios"

};


document
    .getElementById("pageTitle")
    .textContent =
    titles[page] || "Dashboard";


if (page === "invoices") {

    renderInvoices();

}


if (page === "reports") {

    document
        .getElementById("reportResult")
        .scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

}

}

/* =====================================================
DATA ATUAL
===================================================== */

function initializeDate() {

const today = new Date();

document
    .getElementById("currentDate")
    .textContent =
    today.toLocaleDateString(
        "pt-BR",
        {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}

/* =====================================================
DEFAULTS
===================================================== */

function setDefaultDates() {

const today = new Date();

const iso =
    dateToISO(today);


const purchaseDate =
    document.getElementById(
        "purchaseDate"
    );


if (purchaseDate) {

    purchaseDate.value = iso;

}


const month =
    iso.substring(0, 7);


document.getElementById(
    "dashboardMonth"
).value = month;


document.getElementById(
    "invoiceMonth"
).value = month;

}

/* =====================================================
FORMULÁRIOS
===================================================== */

function initializeForms() {

document
    .getElementById("cardForm")
    .addEventListener(
        "submit",
        handleCardSubmit
    );


document
    .getElementById("personForm")
    .addEventListener(
        "submit",
        handlePersonSubmit
    );


document
    .getElementById("purchaseForm")
    .addEventListener(
        "submit",
        handlePurchaseSubmit
    );

}

/* =====================================================
CARTÃO
===================================================== */

function handleCardSubmit(event) {

event.preventDefault();


const name =
    document
        .getElementById("cardName")
        .value
        .trim();


const bank =
    document
        .getElementById("cardBank")
        .value
        .trim();


const limit =
    Number(
        document
            .getElementById("cardLimit")
            .value
    );


const closingDay =
    Number(
        document
            .getElementById("closingDay")
            .value
    );


const dueDay =
    Number(
        document
            .getElementById("dueDay")
            .value
    );


if (!name || limit < 0) {

    alert(
        "Preencha corretamente os dados do cartão."
    );

    return;

}


if (
    closingDay < 1 ||
    closingDay > 31 ||
    dueDay < 1 ||
    dueDay > 31
) {

    alert(
        "Os dias de fechamento e vencimento devem estar entre 1 e 31."
    );

    return;

}


const card = {

    id: generateId(),

    name,

    bank,

    limit,

    closingDay,

    dueDay,

    createdAt:
        new Date().toISOString()

};


cards.push(card);

saveData("cards", cards);


document
    .getElementById("cardForm")
    .reset();


closeModal("cardModal");


renderAll();

}

/* =====================================================
EXCLUIR CARTÃO
===================================================== */

function deleteCard(id) {

const card =
    cards.find(
        item => item.id === id
    );


if (!card) return;


const used =
    purchases.some(
        purchase =>
            purchase.cardId === id
    );


if (used) {

    alert(
        "Não é possível excluir este cartão porque existem compras vinculadas a ele."
    );

    return;

}


if (
    !confirm(
        `Excluir o cartão "${card.name}"?`
    )
) return;


cards =
    cards.filter(
        item => item.id !== id
    );


saveData("cards", cards);

renderAll();

}

/* =====================================================
PESSOAS
===================================================== */

function handlePersonSubmit(event) {

event.preventDefault();


const name =
    document
        .getElementById("personName")
        .value
        .trim();


if (!name) {

    alert("Informe o nome da pessoa.");

    return;

}


const person = {

    id: generateId(),

    name,

    createdAt:
        new Date().toISOString()

};


people.push(person);

saveData("people", people);


document
    .getElementById("personForm")
    .reset();


closeModal("personModal");


renderAll();

}

/* =====================================================
EXCLUIR PESSOA
===================================================== */

function deletePerson(id) {

const person =
    people.find(
        item => item.id === id
    );


if (!person) return;


const used =
    purchases.some(
        purchase =>
            purchase.personId === id
    );


if (used) {

    alert(
        "Não é possível excluir esta pessoa porque existem compras vinculadas a ela."
    );

    return;

}


if (
    !confirm(
        `Excluir "${person.name}"?`
    )
) return;


people =
    people.filter(
        item => item.id !== id
    );


saveData("people", people);

renderAll();

}

/* =====================================================
COMPRA
===================================================== */

function handlePurchaseSubmit(event) {

event.preventDefault();


if (cards.length === 0) {

    alert(
        "Cadastre pelo menos um cartão antes de registrar uma compra."
    );

    return;

}


if (people.length === 0) {

    alert(
        "Cadastre pelo menos uma pessoa antes de registrar uma compra."
    );

    return;

}


const date =
    document
        .getElementById("purchaseDate")
        .value;


const personId =
    document
        .getElementById("purchasePerson")
        .value;


const cardId =
    document
        .getElementById("purchaseCard")
        .value;


const store =
    document
        .getElementById("purchaseStore")
        .value
        .trim();


const description =
    document
        .getElementById("purchaseDescription")
        .value
        .trim();


const value =
    Number(
        document
            .getElementById("purchaseValue")
            .value
    );


const installments =
    Number(
        document
            .getElementById("purchaseInstallments")
            .value
    );


if (
    !date ||
    !personId ||
    !cardId ||
    !store ||
    !description ||
    value <= 0 ||
    installments < 1
) {

    alert(
        "Preencha todos os campos corretamente."
    );

    return;

}


const card =
    cards.find(
        item =>
            item.id === cardId
    );


if (!card) {

    alert("Cartão não encontrado.");

    return;

}


/*
    Calculamos as parcelas agora e
    armazenamos os lançamentos.

    Isso torna o sistema mais rápido para
    consultar as faturas posteriormente.
*/

const installmentData =
    calculateInstallments(
        date,
        value,
        installments,
        card
    );


const purchase = {

    id: generateId(),

    date,

    personId,

    cardId,

    store,

    description,

    value,

    installments,

    installmentValue:
        installmentData.installmentValue,

    installmentEntries:
        installmentData.entries,

    createdAt:
        new Date().toISOString()

};


purchases.push(purchase);

saveData("purchases", purchases);


document
    .getElementById("purchaseForm")
    .reset();


closeModal("purchaseModal");


setDefaultDates();


renderAll();

}

/* =====================================================
CÁLCULO DAS PARCELAS
===================================================== */

/*
REGRA:

O ciclo da fatura é definido pelo dia
de fechamento do cartão.

Exemplo:

Fechamento: dia 25

Compra em 20/09
-> fatura 09/2026

Compra em 26/09
-> fatura 10/2026

Compra parcelada em 3x:

20/09
-> 09/2026
-> 10/2026
-> 11/2026

*/

function calculateInstallments(
purchaseDateString,
totalValue,
numberOfInstallments,
card
) {

const purchaseDate =
    parseLocalDate(
        purchaseDateString
    );


/*
    Divisão em centavos para evitar
    problemas comuns de arredondamento.
*/

const totalCents =
    Math.round(
        totalValue * 100
    );


const baseCents =
    Math.floor(
        totalCents /
        numberOfInstallments
    );


const remainder =
    totalCents %
    numberOfInstallments;


const entries = [];


/*
    Descobrimos a primeira fatura.
*/

let firstInvoice =
    getInvoiceMonth(
        purchaseDate,
        card.closingDay
    );


for (
    let i = 0;
    i < numberOfInstallments;
    i++
) {

    /*
        As primeiras parcelas recebem
        1 centavo extra quando necessário.
    */

    const cents =
        baseCents +
        (i < remainder ? 1 : 0);


    const invoiceMonth =
        addMonthsToMonth(
            firstInvoice,
            i
        );


    const invoiceDate =
        createInvoiceDate(
            invoiceMonth,
            card.dueDay
        );


    entries.push({

        installmentNumber:
            i + 1,

        totalInstallments:
            numberOfInstallments,

        value:
            cents / 100,

        invoiceMonth,

        dueDate:
            invoiceDate

    });

}


return {

    installmentValue:
        totalCents /
        numberOfInstallments /
        100,

    entries

};

}

/* =====================================================
DESCOBRIR MÊS DA FATURA
===================================================== */

function getInvoiceMonth(
purchaseDate,
closingDay
) {

const year =
    purchaseDate.getFullYear();


const month =
    purchaseDate.getMonth();


const day =
    purchaseDate.getDate();


/*
    Se comprou depois do fechamento,
    vai para o próximo mês.
*/

if (day > closingDay) {

    const next =
        new Date(
            year,
            month + 1,
            1
        );


    return formatMonth(next);

}


return formatMonth(
    new Date(
        year,
        month,
        1
    )
);

}

/* =====================================================
DATA DA FATURA
===================================================== */

function createInvoiceDate(
monthString,
dueDay
) {

const [
    year,
    month
] =
    monthString
        .split("-")
        .map(Number);


/*
    Se o mês não possuir o dia indicado,
    usamos o último dia daquele mês.
*/

const lastDay =
    new Date(
        year,
        month,
        0
    ).getDate();


const safeDay =
    Math.min(
        dueDay,
        lastDay
    );


return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;

}

/* =====================================================
OBTER PARCELAS DE UMA COMPRA
===================================================== */

function getPurchaseInstallments(
purchase
) {

/*
    Compatibilidade com registros
    antigos que não possuem entries.
*/

if (
    Array.isArray(
        purchase.installmentEntries
    )
) {

    return purchase.installmentEntries;

}


const card =
    cards.find(
        item =>
            item.id === purchase.cardId
    );


if (!card) return [];


return calculateInstallments(
    purchase.date,
    purchase.value,
    purchase.installments,
    card
).entries;

}

/* =====================================================
FILTRAR LANÇAMENTOS DA FATURA
===================================================== */

function getInvoiceEntries(
month,
cardId = ""
) {

const entries = [];


purchases.forEach(purchase => {

    if (
        cardId &&
        purchase.cardId !== cardId
    ) {

        return;

    }


    const purchaseEntries =
        getPurchaseInstallments(
            purchase
        );


    purchaseEntries.forEach(
        installment => {

            if (
                installment.invoiceMonth ===
                month
            ) {

                entries.push({

                    purchase,

                    installment

                });

            }

        }
    );

});


return entries;

}

/* =====================================================
TOTAL DA FATURA
===================================================== */

function getInvoiceTotal(
month,
cardId = ""
) {

return getInvoiceEntries(
    month,
    cardId
)
.reduce(
    (total, item) =>
        total +
        item.installment.value,
    0
);

}

/* =====================================================
TOTAL FUTURO
===================================================== */

function getFutureTotal() {

const currentMonth =
    formatMonth(
        new Date()
    );


let total = 0;


purchases.forEach(
    purchase => {

        const entries =
            getPurchaseInstallments(
                purchase
            );


        entries.forEach(
            entry => {

                if (
                    entry.invoiceMonth >
                    currentMonth
                ) {

                    total +=
                        entry.value;

                }

            }
        );

    }
);


return total;

}

/* =====================================================
RENDERIZAÇÃO GERAL
===================================================== */

function renderAll() {

renderCards();

renderPeople();

updateSelects();

renderPurchases();

updateDashboard();

renderInvoices();

}

/* =====================================================
RENDER CARTÕES
===================================================== */

function renderCards() {

const container =
    document.getElementById(
        "cardsContainer"
    );


if (cards.length === 0) {

    container.innerHTML = emptyState(
        "fa-credit-card",
        "Nenhum cartão cadastrado",
        "Cadastre o primeiro cartão para começar."
    );

    return;

}


container.innerHTML =
    cards.map(card => {

        const used =
            purchases
                .filter(
                    purchase =>
                        purchase.cardId ===
                        card.id
                )
                .reduce(
                    (total, purchase) =>
                        total +
                        getPurchaseInstallments(
                            purchase
                        )
                        .filter(
                            entry =>
                                entry.invoiceMonth ===
                                formatMonth(new Date())
                        )
                        .reduce(
                            (sum, entry) =>
                                sum +
                                entry.value,
                            0
                        ),
                    0
                );


        const available =
            Math.max(
                card.limit - used,
                0
            );


        return `

            <div class="credit-card">

                <button
                    class="delete-card"
                    onclick="deleteCard('${card.id}')"
                    title="Excluir cartão">

                    <i class="fa-solid fa-trash"></i>

                </button>

                <h3>
                    ${escapeHTML(card.name)}
                </h3>

                <p class="bank">
                    ${escapeHTML(
                        card.bank ||
                        "Banco não informado"
                    )}
                </p>

                <div class="chip"></div>

                <div class="card-values">

                    <div>

                        <small>
                            Disponível
                        </small>

                        <strong>
                            ${formatCurrency(available)}
                        </strong>

                    </div>

                    <div>

                        <small>
                            Limite
                        </small>

                        <strong>
                            ${formatCurrency(card.limit)}
                        </strong>

                    </div>

                </div>

                <div class="card-footer">

                    <span>
                        Fecha dia ${card.closingDay}
                    </span>

                    <span>
                        Vence dia ${card.dueDay}
                    </span>

                </div>

            </div>

        `;

    }).join("");

}

/* =====================================================
RENDER PESSOAS
===================================================== */

function renderPeople() {

const container =
    document.getElementById(
        "peopleContainer"
    );


if (people.length === 0) {

    container.innerHTML = emptyState(
        "fa-users",
        "Nenhuma pessoa cadastrada",
        "Cadastre quem utiliza os cartões."
    );

    return;

}


container.innerHTML =
    people.map(person => {

        const purchasesCount =
            purchases.filter(
                purchase =>
                    purchase.personId ===
                    person.id
            ).length;


        return `

            <div class="person-card">

                <button
                    class="delete-person"
                    onclick="deletePerson('${person.id}')"
                    title="Excluir pessoa">

                    <i class="fa-solid fa-trash"></i>

                </button>

                <div class="person-avatar">

                    <i class="fa-solid fa-user"></i>

                </div>

                <h3>
                    ${escapeHTML(person.name)}
                </h3>

                <p>
                    ${purchasesCount}
                    ${purchasesCount === 1
                        ? "compra"
                        : "compras"}
                </p>

            </div>

        `;

    }).join("");

}

/* =====================================================
SELECTS
===================================================== */

function updateSelects() {

const cardOptions =
    cards.map(card => `

        <option value="${card.id}">
            ${escapeHTML(card.name)}
        </option>

    `).join("");


const personOptions =
    people.map(person => `

        <option value="${person.id}">
            ${escapeHTML(person.name)}
        </option>

    `).join("");


document.getElementById(
    "purchaseCard"
).innerHTML =
    `<option value="">
        Selecione um cartão
    </option>` +
    cardOptions;


document.getElementById(
    "purchasePerson"
).innerHTML =
    `<option value="">
        Selecione uma pessoa
    </option>` +
    personOptions;


document.getElementById(
    "filterCard"
).innerHTML =
    `<option value="">
        Todos os cartões
    </option>` +
    cardOptions;


document.getElementById(
    "filterPerson"
).innerHTML =
    `<option value="">
        Todas as pessoas
    </option>` +
    personOptions;


document.getElementById(
    "invoiceCard"
).innerHTML =
    `<option value="">
        Todos os cartões
    </option>` +
    cardOptions;


document.getElementById(
    "dashboardCard"
).innerHTML =
    `<option value="">
        Todos os cartões
    </option>` +
    cardOptions;

}

/* =====================================================
RENDER COMPRAS
===================================================== */

function renderPurchases() {

const table =
    document.getElementById(
        "purchasesTable"
    );


const search =
    (
        document
            .getElementById(
                "searchPurchase"
            )
            ?.value ||
        ""
    )
    .toLowerCase();


const cardFilter =
    document.getElementById(
        "filterCard"
    )?.value || "";


const personFilter =
    document.getElementById(
        "filterPerson"
    )?.value || "";


const monthFilter =
    document.getElementById(
        "filterMonth"
    )?.value || "";


const filtered =
    purchases
        .filter(purchase => {

            const person =
                people.find(
                    p =>
                        p.id ===
                        purchase.personId
                );


            const card =
                cards.find(
                    c =>
                        c.id ===
                        purchase.cardId
                );


            const text =
                `${purchase.store}
                 ${purchase.description}
                 ${person?.name || ""}
                 ${card?.name || ""}`
                .toLowerCase();


            const matchesSearch =
                !search ||
                text.includes(search);


            const matchesCard =
                !cardFilter ||
                purchase.cardId ===
                cardFilter;


            const matchesPerson =
                !personFilter ||
                purchase.personId ===
                personFilter;


            const matchesMonth =
                !monthFilter ||
                purchase.date
                    .startsWith(
                        monthFilter
                    );


            return (
                matchesSearch &&
                matchesCard &&
                matchesPerson &&
                matchesMonth
            );

        })
        .sort(
            (a, b) =>
                b.date.localeCompare(
                    a.date
                )
        );


if (filtered.length === 0) {

    table.innerHTML = `

        <tr>

            <td colspan="9"
                style="text-align:center;padding:45px">

                Nenhuma compra encontrada.

            </td>

        </tr>

    `;

    return;

}


table.innerHTML =
    filtered.map(
        purchase => {

            const person =
                people.find(
                    p =>
                        p.id ===
                        purchase.personId
                );


            const card =
                cards.find(
                    c =>
                        c.id ===
                        purchase.cardId
                );


            const entries =
                getPurchaseInstallments(
                    purchase
                );


            const firstEntry =
                entries[0];


            const invoiceText =
                firstEntry
                    ? formatMonthName(
                        firstEntry.invoiceMonth
                      )
                    : "-";


            return `

                <tr>

                    <td>
                        ${formatDate(
                            purchase.date
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            person?.name ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            card?.name ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            purchase.store
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            purchase.description
                        )}
                    </td>

                    <td class="value-cell">
                        ${formatCurrency(
                            purchase.value
                        )}
                    </td>

                    <td>

                        <span
                            class="installment-badge">

                            ${purchase.installments}x
                            ${formatCurrency(
                                purchase.installmentValue
                            )}

                        </span>

                    </td>

                    <td>

                        <span
                            class="invoice-badge">

                            ${invoiceText}

                        </span>

                    </td>

                    <td>

                        <div class="table-actions">

                            <button
                                class="icon-button"
                                onclick="viewPurchase('${purchase.id}')"
                                title="Ver parcelas">

                                <i class="fa-solid fa-eye"></i>

                            </button>

                            <button
                                class="icon-button"
                                onclick="deletePurchase('${purchase.id}')"
                                title="Excluir">

                                <i class="fa-solid fa-trash"></i>

                            </button>

                        </div>

                    </td>

                </tr>

            `;

        }
    ).join("");

}

/* =====================================================
VER COMPRA
===================================================== */

function viewPurchase(id) {

const purchase =
    purchases.find(
        item =>
            item.id === id
    );


if (!purchase) return;


const card =
    cards.find(
        item =>
            item.id ===
            purchase.cardId
    );


const person =
    people.find(
        item =>
            item.id ===
            purchase.personId
    );


const entries =
    getPurchaseInstallments(
        purchase
    );


let text =
    `Compra: ${purchase.description}\n\n`;


text +=
    `Pessoa: ${
        person?.name || "-"
    }\n`;


text +=
    `Cartão: ${
        card?.name || "-"
    }\n`;


text +=
    `Estabelecimento: ${
        purchase.store
    }\n`;


text +=
    `Valor total: ${
        formatCurrency(
            purchase.value
        )
    }\n\n`;


text +=
    "Parcelas:\n";


entries.forEach(entry => {

    text +=
        `${entry.installmentNumber}/${
            entry.totalInstallments
        } — ${
            formatCurrency(
                entry.value
            )
        } — Fatura ${
            formatMonthName(
                entry.invoiceMonth
            )
        } — Vencimento ${
            formatDate(
                entry.dueDate
            )
        }\n`;

});


alert(text);

}

/* =====================================================
EXCLUIR COMPRA
===================================================== */

function deletePurchase(id) {

const purchase =
    purchases.find(
        item =>
            item.id === id
    );


if (!purchase) return;


if (
    !confirm(
        `Excluir a compra "${purchase.description}"?`
    )
) return;


purchases =
    purchases.filter(
        item =>
            item.id !== id
    );


saveData(
    "purchases",
    purchases
);


renderAll();

}

/* =====================================================
FILTROS
===================================================== */

function initializeFilters() {

[
    "searchPurchase",
    "filterCard",
    "filterPerson",
    "filterMonth"
]
.forEach(id => {

    const element =
        document.getElementById(id);


    if (!element) return;


    element.addEventListener(
        "input",
        renderPurchases
    );


    element.addEventListener(
        "change",
        renderPurchases
    );

});

}

/* =====================================================
DASHBOARD FILTERS
===================================================== */

function initializeDashboardFilters() {

document
    .getElementById(
        "dashboardCard"
    )
    .addEventListener(
        "change",
        updateDashboard
    );


document
    .getElementById(
        "dashboardMonth"
    )
    .addEventListener(
        "change",
        updateDashboard
    );


document
    .getElementById(
        "invoiceCard"
    )
    .addEventListener(
        "change",
        renderInvoices
    );


document
    .getElementById(
        "invoiceMonth"
    )
    .addEventListener(
        "change",
        renderInvoices
    );

}

/* =====================================================
DASHBOARD
===================================================== */

function updateDashboard() {

const month =
    document
        .getElementById(
            "dashboardMonth"
        )
        .value ||
    formatMonth(
        new Date()
    );


const cardId =
    document
        .getElementById(
            "dashboardCard"
        )
        .value;


const total =
    getInvoiceTotal(
        month,
        cardId
    );


document.getElementById(
    "dashboardInvoice"
).textContent =
    formatCurrency(total);


document.getElementById(
    "dashboardCards"
).textContent =
    cards.length;


document.getElementById(
    "dashboardFuture"
).textContent =
    formatCurrency(
        getFutureTotal()
    );


document.getElementById(
    "dashboardPeople"
).textContent =
    people.length;


document.getElementById(
    "selectedInvoiceTotal"
).textContent =
    formatCurrency(total);


document.getElementById(
    "selectedInvoiceDescription"
).textContent =
    cardId
        ? getCardName(cardId)
        : "Todos os cartões";


renderDashboardInvoiceList(
    month,
    cardId
);


renderRecentPurchases();

renderMonthlyChart();

}

/* =====================================================
DASHBOARD INVOICE LIST
===================================================== */

function renderDashboardInvoiceList(
month,
cardId
) {

const container =
    document.getElementById(
        "dashboardInvoiceList"
    );


const entries =
    getInvoiceEntries(
        month,
        cardId
    )
    .sort(
        (a, b) =>
            a.purchase.date.localeCompare(
                b.purchase.date
            )
    );


if (entries.length === 0) {

    container.innerHTML = `

        <div class="empty-state small">

            <p>
                Nenhum lançamento nesta fatura.
            </p>

        </div>

    `;

    return;

}


container.innerHTML =
    entries.map(
        item => {

            const person =
                people.find(
                    p =>
                        p.id ===
                        item.purchase.personId
                );


            return `

                <div class="mini-invoice-item">

                    <div>

                        <strong>
                            ${escapeHTML(
                                item.purchase.description
                            )}
                        </strong>

                        <span>
                            ${
                                person?.name ||
                                "-"
                            }
                            •
                            ${
                                item.installment
                                    .installmentNumber
                            }/${
                                item.installment
                                    .totalInstallments
                            }
                        </span>

                    </div>

                    <div class="mini-invoice-value">

                        ${formatCurrency(
                            item.installment.value
                        )}

                    </div>

                </div>

            `;

        }
    ).join("");

}

/* =====================================================
RECENTES
===================================================== */

function renderRecentPurchases() {

const container =
    document.getElementById(
        "recentPurchases"
    );


const recent =
    [...purchases]
        .sort(
            (a, b) =>
                b.date.localeCompare(
                    a.date
                )
        )
        .slice(0, 5);


if (recent.length === 0) {

    container.innerHTML =
        emptyState(
            "fa-cart-shopping",
            "Nenhuma compra",
            "As compras recentes aparecerão aqui."
        );

    return;

}


container.innerHTML =
    recent.map(
        purchase => {

            const person =
                people.find(
                    p =>
                        p.id ===
                        purchase.personId
                );


            const card =
                cards.find(
                    c =>
                        c.id ===
                        purchase.cardId
                );


            return `

                <div class="recent-row">

                    <div class="date">

                        ${formatDate(
                            purchase.date
                        )}

                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(
                                purchase.description
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                purchase.store
                            )}
                        </span>

                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(
                                person?.name ||
                                "-"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                card?.name ||
                                "-"
                            )}
                        </span>

                    </div>

                    <div class="recent-value">

                        ${formatCurrency(
                            purchase.value
                        )}

                    </div>

                </div>

            `;

        }
    ).join("");

}

/* =====================================================
GRÁFICO
===================================================== */

function renderMonthlyChart() {

const canvas =
    document.getElementById(
        "monthlyChart"
    );


if (!canvas) return;


if (monthlyChart) {

    monthlyChart.destroy();

}


/*
    Mostramos os próximos 12 ciclos.
*/

const current =
    new Date();


const labels = [];

const values = [];


for (
    let i = -3;
    i < 9;
    i++
) {

    const date =
        new Date(
            current.getFullYear(),
            current.getMonth() + i,
            1
        );


    const month =
        formatMonth(date);


    labels.push(
        formatMonthShort(month)
    );


    values.push(
        getInvoiceTotal(month)
    );

}


monthlyChart =
    new Chart(
        canvas,
        {

            type: "bar",

            data: {

                labels,

                datasets: [

                    {

                        label:
                            "Valor da fatura",

                        data:
                            values,

                        borderWidth: 0,

                        borderRadius: 6

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        display: false

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback:
                                value =>
                                    formatCurrency(
                                        value
                                    )

                        }

                    }

                }

            }

        }
    );

}

/* =====================================================
FATURAS
===================================================== */

function renderInvoices() {

const container =
    document.getElementById(
        "invoiceDetails"
    );


if (!container) return;


const month =
    document.getElementById(
        "invoiceMonth"
    ).value ||
    formatMonth(
        new Date()
    );


const cardId =
    document.getElementById(
        "invoiceCard"
    ).value;


const selectedCards =
    cardId
        ? cards.filter(
            card =>
                card.id === cardId
        )
        : cards;


if (selectedCards.length === 0) {

    container.innerHTML =
        emptyState(
            "fa-credit-card",
            "Nenhum cartão",
            "Cadastre um cartão para visualizar as faturas."
        );

    return;

}


container.innerHTML =
    selectedCards
        .map(card =>
            renderInvoiceCard(
                card,
                month
            )
        )
        .join("");

}

/* =====================================================
CARD DA FATURA
===================================================== */

function renderInvoiceCard(
card,
month
) {

const entries =
    getInvoiceEntries(
        month,
        card.id
    );


const total =
    entries.reduce(
        (sum, item) =>
            sum +
            item.installment.value,
        0
    );


const dueDate =
    getInvoiceDueDate(
        month,
        card.dueDay
    );


let rows;


if (entries.length === 0) {

    rows = `

        <tr>

            <td colspan="7"
                style="text-align:center;padding:35px">

                Nenhuma compra nesta fatura.

            </td>

        </tr>

    `;

} else {

    rows =
        entries.map(
            item => {

                const person =
                    people.find(
                        p =>
                            p.id ===
                            item.purchase.personId
                    );


                return `

                    <tr>

                        <td>
                            ${formatDate(
                                item.purchase.date
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                person?.name ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                item.purchase.store
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                item.purchase.description
                            )}
                        </td>

                        <td>

                            ${
                                item.installment
                                    .installmentNumber
                            }/${
                                item.installment
                                    .totalInstallments
                            }

                        </td>

                        <td>
                            ${formatCurrency(
                                item.installment.value
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                item.installment.dueDate
                            )}
                        </td>

                    </tr>

                `;

            }
        ).join("");

}


return `

    <div class="panel invoice-card">

        <div class="invoice-card-header">

            <div>

                <h3>
                    ${escapeHTML(card.name)}
                </h3>

                <p>
                    Fatura de
                    ${formatMonthName(month)}
                    • Vencimento
                    ${formatDate(dueDate)}
                </p>

            </div>


            <div class="invoice-card-total">

                <small>
                    TOTAL DA FATURA
                </small>

                <strong>
                    ${formatCurrency(total)}
                </strong>

            </div>

        </div>


        <div class="table-responsive">

            <table class="invoice-table">

                <thead>

                    <tr>

                        <th>Compra</th>
                        <th>Quem</th>
                        <th>Local</th>
                        <th>Produto</th>
                        <th>Parcela</th>
                        <th>Valor</th>
                        <th>Vencimento</th>

                    </tr>

                </thead>

                <tbody>

                    ${rows}

                </tbody>

            </table>

        </div>


        <div class="invoice-summary">

            <div>

                <span>
                    Lançamentos
                </span>

                <strong>
                    ${entries.length}
                </strong>

            </div>


            <div>

                <span>
                    Limite
                </span>

                <strong>
                    ${formatCurrency(
                        card.limit
                    )}
                </strong>

            </div>


            <div>

                <span>
                    Fatura
                </span>

                <strong>
                    ${formatCurrency(total)}
                </strong>

            </div>

        </div>

    </div>

`;

}

/* =====================================================
DATA DE VENCIMENTO DA FATURA
===================================================== */

function getInvoiceDueDate(
monthString,
dueDay
) {

return createInvoiceDate(
    monthString,
    dueDay
);

}

/* =====================================================
RELATÓRIO POR PESSOA
===================================================== */

function generatePersonReport() {

const result =
    document.getElementById(
        "reportResult"
    );


if (people.length === 0) {

    result.innerHTML =
        emptyState(
            "fa-users",
            "Nenhuma pessoa cadastrada",
            "Cadastre pessoas para gerar este relatório."
        );

    return;

}


const totals =
    people.map(
        person => {

            const total =
                purchases
                    .filter(
                        purchase =>
                            purchase.personId ===
                            person.id
                    )
                    .reduce(
                        (sum, purchase) =>
                            sum +
                            purchase.value,
                        0
                    );


            return {

                person,

                total

            };

        }
    )
    .sort(
        (a, b) =>
            b.total -
            a.total
    );


result.innerHTML = `

    <div class="panel-header">

        <div>

            <h3>
                Gastos por pessoa
            </h3>

            <p>
                Valor total das compras registradas.
            </p>

        </div>

    </div>

    ${totals.map(item => `

        <div class="mini-invoice-item">

            <div>

                <strong>
                    ${escapeHTML(
                        item.person.name
                    )}
                </strong>

                <span>
                    Compras registradas
                </span>

            </div>

            <div class="mini-invoice-value">

                ${formatCurrency(
                    item.total
                )}

            </div>

        </div>

    `).join("")}

`;

}

/* =====================================================
RELATÓRIO FUTURO
===================================================== */

function generateFutureReport() {

const result =
    document.getElementById(
        "reportResult"
    );


const currentMonth =
    formatMonth(
        new Date()
    );


const totals = {};


purchases.forEach(
    purchase => {

        getPurchaseInstallments(
            purchase
        ).forEach(
            entry => {

                if (
                    entry.invoiceMonth >
                    currentMonth
                ) {

                    if (
                        !totals[
                            entry.invoiceMonth
                        ]
                    ) {

                        totals[
                            entry.invoiceMonth
                        ] = 0;

                    }


                    totals[
                        entry.invoiceMonth
                    ] +=
                        entry.value;

                }

            }
        );

    }
);


const months =
    Object.keys(totals)
        .sort();


if (months.length === 0) {

    result.innerHTML =
        emptyState(
            "fa-calendar-check",
            "Nenhuma parcela futura",
            "Não existem parcelas futuras cadastradas."
        );

    return;

}


result.innerHTML = `

    <div class="panel-header">

        <div>

            <h3>
                Comprometimento futuro
            </h3>

            <p>
                Valores das parcelas já cadastradas.
            </p>

        </div>

    </div>

    ${months.map(month => `

        <div class="mini-invoice-item">

            <div>

                <strong>
                    ${formatMonthName(month)}
                </strong>

                <span>
                    Parcelas previstas
                </span>

            </div>

            <div class="mini-invoice-value">

                ${formatCurrency(
                    totals[month]
                )}

            </div>

        </div>

    `).join("")}

`;

}

/* =====================================================
EXPORTAR EXCEL
===================================================== */

function exportExcel() {

if (purchases.length === 0) {

    alert(
        "Não existem compras para exportar."
    );

    return;

}


const rows = [];


purchases.forEach(
    purchase => {

        const person =
            people.find(
                p =>
                    p.id ===
                    purchase.personId
            );


        const card =
            cards.find(
                c =>
                    c.id ===
                    purchase.cardId
            );


        getPurchaseInstallments(
            purchase
        ).forEach(
            installment => {

                rows.push({

                    "Data da compra":
                        formatDate(
                            purchase.date
                        ),

                    "Quem comprou":
                        person?.name ||
                        "",

                    "Cartão":
                        card?.name ||
                        "",

                    "Banco":
                        card?.bank ||
                        "",

                    "Estabelecimento":
                        purchase.store,

                    "Produto":
                        purchase.description,

                    "Valor total":
                        purchase.value,

                    "Parcela":
                        `${installment.installmentNumber}/${installment.totalInstallments}`,

                    "Valor da parcela":
                        installment.value,

                    "Fatura":
                        formatMonthName(
                            installment.invoiceMonth
                        ),

                    "Vencimento":
                        formatDate(
                            installment.dueDate
                        )

                });

            }
        );

    }
);


const worksheet =
    XLSX.utils.json_to_sheet(
        rows
    );


const workbook =
    XLSX.utils.book_new();


XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Controle de Cartões"
);


XLSX.writeFile(
    workbook,
    `controle-cartoes-${formatMonth(new Date())}.xlsx`
);

}

/* =====================================================
PREVIEW DE PARCELAS
===================================================== */

function initializePurchasePreview() {

[
    "purchaseValue",
    "purchaseInstallments",
    "purchaseDate",
    "purchaseCard"
]
.forEach(id => {

    document
        .getElementById(id)
        .addEventListener(
            "input",
            updateInstallmentPreview
        );


    document
        .getElementById(id)
        .addEventListener(
            "change",
            updateInstallmentPreview
        );

});

}

function updateInstallmentPreview() {

const value =
    Number(
        document.getElementById(
            "purchaseValue"
        ).value
    );


const installments =
    Number(
        document.getElementById(
            "purchaseInstallments"
        ).value
    );


const date =
    document.getElementById(
        "purchaseDate"
    ).value;


const cardId =
    document.getElementById(
        "purchaseCard"
    ).value;


const container =
    document.getElementById(
        "installmentPreview"
    );


if (
    !value ||
    value <= 0 ||
    !installments ||
    !date ||
    !cardId
) {

    container.innerHTML = `

        <div class="preview-title">

            <i class="fa-solid fa-calculator"></i>

            Simulação

        </div>

        <p>
            Preencha valor, parcelas, data e cartão
            para visualizar.
        </p>

    `;

    return;

}


const card =
    cards.find(
        item =>
            item.id === cardId
    );


if (!card) return;


const result =
    calculateInstallments(
        date,
        value,
        installments,
        card
    );


const first =
    result.entries[0];


const last =
    result.entries[
        result.entries.length - 1
    ];


container.innerHTML = `

    <div class="preview-title">

        <i class="fa-solid fa-calculator"></i>

        Simulação

    </div>

    <div class="preview-result">

        <div>

            <strong>
                ${formatCurrency(
                    result.installmentValue
                )}
            </strong>

            <span>
                por parcela
            </span>

        </div>

        <div>

            <span>
                ${formatMonthName(
                    first.invoiceMonth
                )}
                até
                ${formatMonthName(
                    last.invoiceMonth
                )}
            </span>

        </div>

    </div>

`;

}

/* =====================================================
MODAIS
===================================================== */

function openCardModal() {

document
    .getElementById(
        "cardModal"
    )
    .classList.add("show");

}

function openPersonModal() {

document
    .getElementById(
        "personModal"
    )
    .classList.add("show");

}

function openPurchaseModal() {

if (cards.length === 0) {

    alert(
        "Cadastre primeiro um cartão."
    );

    changePage("cards");

    return;

}


if (people.length === 0) {

    alert(
        "Cadastre primeiro uma pessoa."
    );

    changePage("people");

    return;

}


updateSelects();

setDefaultDates();


document
    .getElementById(
        "purchaseModal"
    )
    .classList.add("show");

}

function closeModal(id) {

document
    .getElementById(id)
    .classList.remove("show");

}

/* Fechar clicando fora */

document.addEventListener(
"click",
event => {

    if (
        event.target.classList.contains(
            "modal"
        )
    ) {

        event.target.classList.remove(
            "show"
        );

    }

}

);

/* =====================================================
TEMA
===================================================== */

function toggleTheme() {

document.body.classList.toggle(
    "dark-mode"
);


const dark =
    document.body.classList.contains(
        "dark-mode"
    );


localStorage.setItem(
    "darkMode",
    dark
);

}

if (
localStorage.getItem(
"darkMode"
) === "true"
) {

document.body.classList.add(
    "dark-mode"
);

}

/* =====================================================
UTILITÁRIOS
===================================================== */

function generateId() {

return (
    Date.now().toString(36) +
    Math.random()
        .toString(36)
        .substring(2, 9)
);

}

function parseLocalDate(dateString) {

const [
    year,
    month,
    day
] =
    dateString
        .split("-")
        .map(Number);


return new Date(
    year,
    month - 1,
    day
);

}

function dateToISO(date) {

return `${date.getFullYear()}-${
    String(
        date.getMonth() + 1
    ).padStart(2, "0")
}-${
    String(
        date.getDate()
    ).padStart(2, "0")
}`;

}

function formatMonth(date) {

return `${date.getFullYear()}-${
    String(
        date.getMonth() + 1
    ).padStart(2, "0")
}`;

}

function formatMonthShort(monthString) {

const [
    year,
    month
] =
    monthString
        .split("-")
        .map(Number);


return new Date(
    year,
    month - 1,
    1
).toLocaleDateString(
    "pt-BR",
    {
        month: "short"
    }
);

}

function formatMonthName(monthString) {

if (!monthString) return "-";


const [
    year,
    month
] =
    monthString
        .split("-")
        .map(Number);


return new Date(
    year,
    month - 1,
    1
).toLocaleDateString(
    "pt-BR",
    {
        month: "long",
        year: "numeric"
    }
);

}

function addMonthsToMonth(
monthString,
amount
) {

const [
    year,
    month
] =
    monthString
        .split("-")
        .map(Number);


return formatMonth(
    new Date(
        year,
        month - 1 + amount,
        1
    )
);

}

function formatDate(dateString) {

if (!dateString) return "-";


const [
    year,
    month,
    day
] =
    dateString.split("-");


return `${day}/${month}/${year}`;

}

function formatCurrency(value) {

return Number(
    value || 0
).toLocaleString(
    "pt-BR",
    {
        style: "currency",
        currency: "BRL"
    }
);

}

function getCardName(id) {

const card =
    cards.find(
        item =>
            item.id === id
    );


return card
    ? card.name
    : "Cartão";

}

function escapeHTML(value) {

return String(value ?? "")
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}

function emptyState(
icon,
title,
description
) {

return `

    <div class="empty-state">

        <i class="fa-solid ${icon}"></i>

        <h3>
            ${title}
        </h3>

        <p>
            ${description}
        </p>

    </div>

`;

}