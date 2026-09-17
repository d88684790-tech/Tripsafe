// @ts-nocheck

let balance = 0;
let payday = null;
let salary = 0;
let cycleStartDate = null;

let emergencyReserve = 0;
let fixedExpenses = 0;

let transactions = [];

let transactionType = "expense";

let trip = {
  active: false,
  name: "",
  budget: 0,
  endDate: null
};


// Get today's date
function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// Save everything
function saveData() {
  const data = {
    balance: balance,
    payday: payday,
    salary: salary,
    cycleStartDate: cycleStartDate,
    emergencyReserve: emergencyReserve,
    fixedExpenses: fixedExpenses,
    transactions: transactions,
    trip: trip
  };

  localStorage.setItem(
    "tripsafeData",
    JSON.stringify(data)
  );
}


// Load everything
function loadData() {
  const savedData = localStorage.getItem("tripsafeData");

  if (!savedData) {
    return;
  }

  try {
    const data = JSON.parse(savedData);

    balance = Number(data.balance) || 0;
    payday = data.payday || null;
    salary = Number(data.salary) || 0;
    cycleStartDate = data.cycleStartDate || null;

    emergencyReserve =
      Number(data.emergencyReserve) || 0;

    fixedExpenses =
      Number(data.fixedExpenses) || 0;

    transactions =
      Array.isArray(data.transactions)
        ? data.transactions
        : [];

    if (data.trip) {
      trip = {
        active: Boolean(data.trip.active),
        name: data.trip.name || "",
        budget: Number(data.trip.budget) || 0,
        endDate: data.trip.endDate || null
      };
    }

  } catch (error) {
    console.log("Could not load saved data.", error);
  }
}

// Update the whole screen
function updateScreen() {
  updateBalance();
  updatePayday();
  updateCycleDisplay();
  updateTripDisplay();
  updateCategoryStats();
  displayTransactions();
}


// Update balance
function updateBalance() {
  const balanceElement =
    document.getElementById("balance");

  balanceElement.textContent =
    "RM " + balance.toFixed(2);
}


// Payday calculations
function updatePayday() {

  const daysElement =
    document.getElementById("daysLeft");

  const safeDailyElement =
    document.getElementById("safeDaily");

  const averageDailyElement =
    document.getElementById("averageDaily");

  const projectedBalanceElement =
    document.getElementById("projectedBalance");

  const survivalIcon =
    document.getElementById("survivalIcon");

  const survivalTitle =
    document.getElementById("survivalTitle");

  const survivalMessage =
    document.getElementById("survivalMessage");

  const statusElement =
    document.getElementById("status");


  // No payday
  if (!payday) {

    daysElement.textContent = "--";

    safeDailyElement.textContent =
      "RM 0.00";

    averageDailyElement.textContent =
      "RM 0.00";

    projectedBalanceElement.textContent =
      "RM 0.00";

    survivalIcon.textContent = "🟢";

    survivalTitle.textContent =
      "Set your payday";

    survivalMessage.textContent =
      "We'll calculate whether your money can last until payday.";

    statusElement.textContent =
      "Set your salary cycle to get started.";

    return;
  }


  // Calculate days left
  const today =
    new Date(getTodayString() + "T00:00:00");

  const paydayDate =
    new Date(payday + "T00:00:00");

  const difference =
    paydayDate.getTime() -
    today.getTime();

  let daysLeft =
    Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

  if (daysLeft < 0) {
    daysLeft = 0;
  }

  daysElement.textContent = daysLeft;


  // Calculate current cycle spending
  let totalSpent = 0;

  transactions.forEach(function(transaction) {

    if (
      transaction.type === "expense" &&
      (
        !cycleStartDate ||
        transaction.date >= cycleStartDate
      )
    ) {
      totalSpent +=
        Number(transaction.amount) || 0;
    }

  });


  // Calculate average daily spending
  let averageDaily = 0;

  if (cycleStartDate) {

    const startDate =
      new Date(
        cycleStartDate + "T00:00:00"
      );

    const todayDate =
      new Date(
        getTodayString() + "T00:00:00"
      );

    const difference =
      todayDate.getTime() -
      startDate.getTime();

    let daysPassed =
      Math.floor(
        difference /
        (1000 * 60 * 60 * 24)
      ) + 1;

    if (daysPassed < 1) {
      daysPassed = 1;
    }

    averageDaily =
      totalSpent / daysPassed;
  }


  averageDailyElement.textContent =
    "RM " + averageDaily.toFixed(2);


  // Calculate available money
  let availableMoney =
    balance -
    emergencyReserve -
    fixedExpenses;

  if (availableMoney < 0) {
    availableMoney = 0;
  }


  // Safe daily spending
  let safeDaily = 0;

  if (daysLeft > 0) {
    safeDaily =
      availableMoney / daysLeft;
  }

  safeDailyElement.textContent =
    "RM " + safeDaily.toFixed(2);


  // Projected balance
  let projectedBalance =
    balance;

  if (daysLeft > 0) {
    projectedBalance =
      balance -
      (averageDaily * daysLeft);
  }

  projectedBalanceElement.textContent =
    "RM " + projectedBalance.toFixed(2);


  // Survival status
  if (daysLeft === 0) {

    survivalIcon.textContent = "💵";

    survivalTitle.textContent =
      "Payday is here!";

    survivalMessage.textContent =
      "Your current salary cycle has reached payday.";

    statusElement.textContent =
      "Salary day has arrived.";

  }

  else if (balance <= 0) {

    survivalIcon.textContent = "🔴";

    survivalTitle.textContent =
      "No money left";

    survivalMessage.textContent =
      "Your current balance is RM 0 or below.";

    statusElement.textContent =
      "Your balance is empty.";

  }

  else if (availableMoney <= 0) {

    survivalIcon.textContent = "🔴";

    survivalTitle.textContent =
      "Money is reserved";

    survivalMessage.textContent =
      "Your remaining money is covered by your reserve or fixed expenses.";

    statusElement.textContent =
      "Most of your money is already reserved.";

  }

  else if (projectedBalance < 0) {

    survivalIcon.textContent = "🔴";

    survivalTitle.textContent =
      "SURVIVAL WARNING";

    survivalMessage.textContent =
      "At your current spending rate, your money may run out before payday.";

    statusElement.textContent =
      "Spending rate is too high.";

  }

  else if (averageDaily > safeDaily) {

    survivalIcon.textContent = "🟡";

    survivalTitle.textContent =
      "Be careful";

    survivalMessage.textContent =
      "Your current spending rate is higher than your safe daily budget.";

    statusElement.textContent =
      "Try reducing daily spending.";

  }

  else {

    survivalIcon.textContent = "🟢";

    survivalTitle.textContent =
      "Money is on track";

    survivalMessage.textContent =
      "Your current spending rate should allow your money to last until payday.";

    statusElement.textContent =
      "Your spending is currently on track.";
  }
}

// Salary cycle display
function updateCycleDisplay() {

  const salaryElement =
    document.getElementById("cycleSalary");

  const spentElement =
    document.getElementById("cycleSpent");

  const reserveElement =
    document.getElementById("cycleReserve");

  const fixedElement =
    document.getElementById("cycleFixed");

  const remainingElement =
    document.getElementById("cycleRemaining");


  let spent = 0;

  transactions.forEach(function(transaction) {

    if (
      transaction.type === "expense" &&
      (
        !cycleStartDate ||
        transaction.date >= cycleStartDate
      )
    ) {
      spent +=
        Number(transaction.amount) || 0;
    }

  });


  let available =
    balance -
    emergencyReserve -
    fixedExpenses;

  if (available < 0) {
    available = 0;
  }


  salaryElement.textContent =
    "RM " + salary.toFixed(2);

  spentElement.textContent =
    "RM " + spent.toFixed(2);

  reserveElement.textContent =
    "RM " + emergencyReserve.toFixed(2);

  fixedElement.textContent =
    "RM " + fixedExpenses.toFixed(2);

  remainingElement.textContent =
    "RM " + available.toFixed(2);
}


// Save salary cycle
document
  .getElementById("savePaydayBtn")
  .addEventListener("click", function() {

    const salaryValue =
      parseFloat(
        document.getElementById("salaryInput").value
      );

    const selectedDate =
      document.getElementById("payday").value;

    const reserveValue =
      parseFloat(
        document.getElementById("reserveInput").value
      ) || 0;

    const fixedValue =
      parseFloat(
        document.getElementById("fixedExpensesInput").value
      ) || 0;


    if (
      isNaN(salaryValue) ||
      salaryValue < 0
    ) {
      alert("Please enter a valid salary.");
      return;
    }


    if (!selectedDate) {
      alert("Please select your payday.");
      return;
    }


    salary = salaryValue;

    payday = selectedDate;

    emergencyReserve = reserveValue;

    fixedExpenses = fixedValue;


    if (!cycleStartDate) {
      cycleStartDate =
        getTodayString();
    }


    saveData();

    updateScreen();

    alert("Salary cycle saved! 💵");

  });

// Open transaction form
function openForm(type) {

  transactionType = type;

  const form =
    document.getElementById("transactionForm");

  const title =
    document.getElementById("formTitle");

  const amountInput =
    document.getElementById("amountInput");

  const descriptionInput =
    document.getElementById("descriptionInput");

  const dateInput =
    document.getElementById("dateInput");


  const formIcon =
  document.getElementById(
    "formIcon"
  );

const formSubtitle =
  document.getElementById(
    "formSubtitle"
  );


if (type === "income") {

  title.textContent =
    "Add Money";

  formSubtitle.textContent =
    "Record money coming in";

  formIcon.textContent =
    "💰";

  formIcon.classList.add(
    "income-form"
  );

  formIcon.classList.remove(
    "expense-form"
  );

}

else {

  title.textContent =
    "Add Expense";

  formSubtitle.textContent =
    "Record money going out";

  formIcon.textContent =
    "💸";

  formIcon.classList.add(
    "expense-form"
  );

  formIcon.classList.remove(
    "income-form"
  );

}

  amountInput.value = "";

  descriptionInput.value = "";

  dateInput.value =
    getTodayString();


  form.style.display = "block";


  form.scrollIntoView({
    behavior: "smooth"
  });

}


// Close form
function closeForm() {

  document.getElementById(
    "transactionForm"
  ).style.display = "none";

}


// Add Money button
document
  .getElementById("addMoneyBtn")
  .addEventListener("click", function() {

    openForm("income");

  });


// Add Expense button
document
  .getElementById("addExpenseBtn")
  .addEventListener("click", function() {

    openForm("expense");

  });


// Save transaction
document
  .getElementById("moneyForm")
  .addEventListener("submit", function(event) {

    event.preventDefault();


    const amount =
      parseFloat(
        document.getElementById("amountInput").value
      );

    const description =
      document.getElementById(
        "descriptionInput"
      ).value.trim();

    const category =
      document.getElementById(
        "categoryInput"
      ).value;

    const date =
      document.getElementById(
        "dateInput"
      ).value;


    if (
      isNaN(amount) ||
      amount <= 0
    ) {

      alert("Please enter a valid amount.");

      return;
    }


    if (!description) {

      alert("Please enter a description.");

      return;
    }


    if (!date) {

      alert("Please select a date.");

      return;
    }


    // Income
    if (transactionType === "income") {

      balance += amount;

      transactions.push({

        type: "income",

        amount: amount,

        description: description,

        category: category,

        date: date

      });

    }


    // Expense
    else {

      balance -= amount;

      transactions.push({

        type: "expense",

        amount: amount,

        description: description,

        category: category,

        date: date

      });

    }


    saveData();

    updateScreen();

    closeForm();

  });


// Cancel button
document
  .getElementById("cancelBtn")
  .addEventListener("click", function() {

    closeForm();

  });

// Display transactions
function displayTransactions() {

  const container =
    document.getElementById("transactions");


  container.innerHTML = "";


  if (transactions.length === 0) {

    container.textContent =
      "No transactions yet.";

    return;
  }


  const reversed =
    [...transactions].reverse();


  reversed.forEach(function(
    transaction,
    reversedIndex
  ) {

    const actualIndex =
      transactions.length -
      1 -
      reversedIndex;


    const item =
      document.createElement("div");

    item.className =
      "transaction-item";


    const amount =
      Number(transaction.amount) || 0;


    const isIncome =
      transaction.type === "income";


    const sign =
      isIncome ? "+" : "-";


    const amountClass =
      isIncome
        ? "income-amount"
        : "expense-amount";


    const categoryIcons = {

  Food: "🍔",

  Transport: "🚗",

  Shopping: "🛍️",

  Accommodation: "🏨",

  Entertainment: "🎮",

  Bills: "📄",

  Travel: "✈️",

  Other: "📦"

};


const categoryIcon =
  categoryIcons[
    transaction.category
  ] || "📦";


item.innerHTML = `

  <div class="transaction-icon">
    ${categoryIcon}
  </div>

  <div class="transaction-info">

    <strong>
      ${escapeHTML(
        transaction.description
      )}
    </strong>

    <small>
      ${escapeHTML(
        transaction.category || "Other"
      )}
      •
      ${transaction.date}
    </small>

    <button
      class="delete-transaction"
      data-index="${actualIndex}"
    >
      Delete
    </button>

  </div>

  <strong class="${amountClass}">
    ${sign} RM ${amount.toFixed(2)}
  </strong>

`;

    container.appendChild(item);

  });


  // Delete transaction buttons
  document
    .querySelectorAll(".delete-transaction")
    .forEach(function(button) {

      button.addEventListener(
        "click",
        function() {

          const index =
            Number(button.dataset.index);


          const transaction =
            transactions[index];


          if (!transaction) {
            return;
          }


          // Reverse the transaction
          if (
            transaction.type === "income"
          ) {

            balance -=
              Number(transaction.amount) || 0;

          } else {

            balance +=
              Number(transaction.amount) || 0;

          }


          transactions.splice(
            index,
            1
          );


          saveData();

          updateScreen();

        }
      );

    });

}


// Prevent HTML problems
function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}


// Clear transactions
document
  .getElementById("clearTransactionsBtn")
  .addEventListener("click", function() {

    if (transactions.length === 0) {
      return;
    }


    const confirmed =
      confirm(
        "Clear all transaction history?"
      );


    if (!confirmed) {
      return;
    }


    transactions = [];


    saveData();

    updateScreen();

  });

// ==========================================
// CATEGORY STATISTICS
// ==========================================

function updateCategoryStats() {

  const container =
    document.getElementById(
      "categoryStats"
    );


  const expenses =
    transactions.filter(function(transaction) {

      return transaction.type === "expense";

    });


  if (expenses.length === 0) {

    container.textContent =
      "No expenses yet.";

    return;

  }


  const categories = {};


  expenses.forEach(function(transaction) {

    const category =
      transaction.category || "Other";


    if (!categories[category]) {

      categories[category] = 0;

    }


    categories[category] +=
      Number(transaction.amount) || 0;

  });


  let total = 0;


  Object.keys(categories).forEach(
    function(category) {

      total +=
        categories[category];

    }
  );


  container.innerHTML = "";


  Object.keys(categories)
    .sort(function(a, b) {

      return categories[b] -
        categories[a];

    })
    .forEach(function(category) {

      const amount =
        categories[category];


      const percentage =
        total > 0
          ? (amount / total) * 100
          : 0;


      const row =
        document.createElement("div");


      row.className =
        "category-row";


      row.innerHTML = `

        <div class="category-header">

          <span>
            ${escapeHTML(category)}
          </span>

          <strong>
            RM ${amount.toFixed(2)}
          </strong>

        </div>

        <div class="category-bar-background">

          <div
            class="category-bar"
            style="width: ${percentage}%"
          ></div>

        </div>

      `;


      container.appendChild(row);

    });

}


// ==========================================
// CAN I AFFORD THIS?
// ==========================================

document
  .getElementById("checkAffordBtn")
  .addEventListener("click", function() {

    const amount =
      parseFloat(
        document.getElementById(
          "affordAmount"
        ).value
      );


    const result =
      document.getElementById(
        "affordResult"
      );


    if (
      isNaN(amount) ||
      amount <= 0
    ) {

      result.textContent =
        "Please enter a valid amount.";

      return;

    }


    let available =
      balance -
      emergencyReserve -
      fixedExpenses;


    if (available < 0) {
      available = 0;
    }


    if (amount > available) {

      const shortage =
        amount - available;


      result.innerHTML = `

        🔴 <strong>Not recommended.</strong><br>

        You would exceed your available
        spending money by

        RM ${shortage.toFixed(2)}.

      `;

    }

    else {

      const remaining =
        available - amount;


      result.innerHTML = `

        🟢 <strong>It fits your available money.</strong><br>

        After this purchase, you would have

        RM ${remaining.toFixed(2)}
        available.

      `;

    }

  });

// ==========================================
// TRIP MODE
// ==========================================

document
  .getElementById("saveTripBtn")
  .addEventListener("click", function() {

    const name =
      document.getElementById(
        "tripName"
      ).value.trim();


    const budget =
      parseFloat(
        document.getElementById(
          "tripBudget"
        ).value
      );


    const endDate =
      document.getElementById(
        "tripEndDate"
      ).value;


    if (!name) {

      alert(
        "Please enter a trip name."
      );

      return;

    }


    if (
      isNaN(budget) ||
      budget <= 0
    ) {

      alert(
        "Please enter a valid trip budget."
      );

      return;

    }


    if (!endDate) {

      alert(
        "Please select your trip end date."
      );

      return;

    }


    trip = {

      active: true,

      name: name,

      budget: budget,

      endDate: endDate

    };


    saveData();

    updateScreen();


    alert(
      "Trip mode activated! 🌴"
    );

  });


// ==========================================
// TRIP DISPLAY
// ==========================================

function updateTripDisplay() {

  const summary =
    document.getElementById(
      "tripSummary"
    );


  if (!trip.active) {

    summary.textContent =
      "Trip mode is not active.";

    return;

  }


  let tripSpent = 0;


  transactions.forEach(function(transaction) {

    if (
      transaction.type === "expense" &&
      transaction.category === "Travel"
    ) {

      tripSpent +=
        Number(transaction.amount) || 0;

    }

  });


  const remaining =
    trip.budget - tripSpent;


  const today =
    new Date(
      getTodayString() + "T00:00:00"
    );


  const endDate =
    new Date(
      trip.endDate + "T00:00:00"
    );


  let daysLeft =
    Math.ceil(
      (
        endDate.getTime() -
        today.getTime()
      ) /
      (1000 * 60 * 60 * 24)
    );


  if (daysLeft < 0) {
    daysLeft = 0;
  }


  let dailyBudget = 0;


  if (daysLeft > 0) {

    dailyBudget =
      remaining / daysLeft;

  }


  summary.innerHTML = `

    <strong>🌴 ${escapeHTML(trip.name)}</strong><br>

    Budget:
    RM ${trip.budget.toFixed(2)}<br>

    Travel spending:
    RM ${tripSpent.toFixed(2)}<br>

    Remaining:
    RM ${remaining.toFixed(2)}<br>

    Days remaining:
    ${daysLeft}<br>

    Safe trip spending/day:
    RM ${dailyBudget.toFixed(2)}

  `;

}


// ==========================================
// RESET EVERYTHING
// ==========================================

document
  .getElementById("resetBtn")
  .addEventListener("click", function() {

    const confirmed =
      confirm(
        "This will delete ALL TripSafe data. Continue?"
      );


    if (!confirmed) {
      return;
    }


    localStorage.removeItem(
      "tripsafeData"
    );


    balance = 0;

    payday = null;

    salary = 0;

    cycleStartDate = null;

    emergencyReserve = 0;

    fixedExpenses = 0;

    transactions = [];


    trip = {

      active: false,

      name: "",

      budget: 0,

      endDate: null

    };


    document.getElementById(
      "salaryInput"
    ).value = "";


    document.getElementById(
      "payday"
    ).value = "";


    document.getElementById(
      "reserveInput"
    ).value = "";


    document.getElementById(
      "fixedExpensesInput"
    ).value = "";


    document.getElementById(
      "tripName"
    ).value = "";


    document.getElementById(
      "tripBudget"
    ).value = "";


    document.getElementById(
      "tripEndDate"
    ).value = "";


    updateScreen();

  });


// ==========================================
// RESTORE SAVED INPUTS
// ==========================================

function restoreInputs() {

  if (salary > 0) {

    document.getElementById(
      "salaryInput"
    ).value = salary;

  }


  if (payday) {

    document.getElementById(
      "payday"
    ).value = payday;

  }


  if (emergencyReserve > 0) {

    document.getElementById(
      "reserveInput"
    ).value =
      emergencyReserve;

  }


  if (fixedExpenses > 0) {

    document.getElementById(
      "fixedExpensesInput"
    ).value =
      fixedExpenses;

  }


  if (trip.active) {

    document.getElementById(
      "tripName"
    ).value =
      trip.name;


    document.getElementById(
      "tripBudget"
    ).value =
      trip.budget;


    document.getElementById(
      "tripEndDate"
    ).value =
      trip.endDate;

  }

}


// ==========================================
// START TRIPSAFE
// ==========================================

loadData();

restoreInputs();

updateScreen();

// ==========================================
// SERVICE WORKER
// ==========================================

if ("serviceWorker" in navigator) {

  window.addEventListener(
    "load",
    function() {

      navigator.serviceWorker
        .register("./service-worker.js")
        .then(function() {

          console.log(
            "TripSafe offline mode enabled."
          );

        })

        .catch(function(error) {

          console.log(
            "Service worker registration failed:",
            error
          );

        });

    }
  );

}