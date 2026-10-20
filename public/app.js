(function () {
  "use strict";

  const TASHKENT_TZ = "Asia/Tashkent";

  function todayInTashkent() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: TASHKENT_TZ }).format(new Date());
  }

  function currentMonthInTashkent() {
    return todayInTashkent().slice(0, 7);
  }

  function formatMoney(amount) {
    return `${Number(amount).toLocaleString("ru-RU")} so'm`;
  }

  async function apiFetch(url, options) {
    const res = await fetch(url, options);
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      const message = (data && data.error) || `Ошибка запроса (${res.status})`;
      throw new Error(message);
    }
    return data;
  }

  const monthInput = document.getElementById("month-input");
  const debtorsTotal = document.getElementById("debtors-total");
  const debtorsList = document.getElementById("debtors-list");
  const studentSelect = document.getElementById("student-select");
  const amountInput = document.getElementById("amount-input");
  const dateInput = document.getElementById("date-input");
  const paymentForm = document.getElementById("payment-form");
  const paymentMessage = document.getElementById("payment-message");

  function renderDebtors(debtors) {
    debtorsList.innerHTML = "";

    if (debtors.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Нет должников за этот месяц.";
      debtorsList.appendChild(empty);
      debtorsTotal.textContent = "";
      return;
    }

    let total = 0;

    for (const debtor of debtors) {
      total += debtor.debt;

      const card = document.createElement("article");
      card.className = "debtor-card";

      const name = document.createElement("div");
      name.className = "debtor-name";
      name.textContent = debtor.name;
      card.appendChild(name);

      const meta = document.createElement("div");
      meta.className = "debtor-meta";
      meta.textContent = `${debtor.group} · ${debtor.phone}`;
      card.appendChild(meta);

      const rows = [
        ["Оплачено", formatMoney(debtor.paid)],
        ["Ежемесячная оплата", formatMoney(debtor.monthlyFee)],
      ];

      for (const [label, value] of rows) {
        const row = document.createElement("div");
        row.className = "debtor-row";
        const labelEl = document.createElement("span");
        labelEl.textContent = label;
        const valueEl = document.createElement("span");
        valueEl.textContent = value;
        row.appendChild(labelEl);
        row.appendChild(valueEl);
        card.appendChild(row);
      }

      const debtRow = document.createElement("div");
      debtRow.className = "debtor-row debtor-debt";
      const debtLabel = document.createElement("span");
      debtLabel.textContent = "Долг";
      const debtValue = document.createElement("span");
      debtValue.textContent = formatMoney(debtor.debt);
      debtRow.appendChild(debtLabel);
      debtRow.appendChild(debtValue);
      card.appendChild(debtRow);

      debtorsList.appendChild(card);
    }

    debtorsTotal.textContent = `Общий долг: ${formatMoney(total)}`;
  }

  async function loadDebtors() {
    const month = monthInput.value;
    if (!month) return;

    try {
      const debtors = await apiFetch(`/debtors?month=${encodeURIComponent(month)}`);
      renderDebtors(debtors);
    } catch (err) {
      debtorsList.innerHTML = "";
      const error = document.createElement("div");
      error.className = "empty-state";
      error.textContent = err.message;
      debtorsList.appendChild(error);
      debtorsTotal.textContent = "";
    }
  }

  async function loadStudents() {
    const students = await apiFetch("/students");
    studentSelect.innerHTML = "";
    for (const student of students) {
      const option = document.createElement("option");
      option.value = String(student.id);
      option.textContent = `${student.name} (${student.group})`;
      studentSelect.appendChild(option);
    }
  }

  async function handlePaymentSubmit(event) {
    event.preventDefault();
    paymentMessage.textContent = "";
    paymentMessage.className = "";

    const body = {
      studentId: Number(studentSelect.value),
      amount: Number(amountInput.value),
      date: dateInput.value || undefined,
    };

    try {
      await apiFetch("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      paymentMessage.textContent = "Оплата добавлена.";
      paymentMessage.className = "success";
      paymentForm.reset();
      dateInput.value = todayInTashkent();
      await loadDebtors();
    } catch (err) {
      paymentMessage.textContent = err.message;
      paymentMessage.className = "error";
    }
  }

  async function init() {
    monthInput.value = currentMonthInTashkent();
    dateInput.value = todayInTashkent();

    monthInput.addEventListener("change", loadDebtors);
    paymentForm.addEventListener("submit", handlePaymentSubmit);

    await Promise.all([loadStudents(), loadDebtors()]);
  }

  init();
})();
