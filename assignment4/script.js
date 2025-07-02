
        document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const transactionForm = document.getElementById('transaction-form');
            const transactionName = document.getElementById('transaction-name');
            const transactionAmount = document.getElementById('transaction-amount');
            const transactionCategory = document.getElementById('transaction-category');
            const transactionTypeRadios = document.querySelectorAll('input[name="transaction-type"]');
            const transactionDate = document.getElementById('transaction-date');
            const transactionList = document.getElementById('transaction-list');
            const balanceAmount = document.getElementById('balance-amount');
            const incomeAmount = document.getElementById('income-amount');
            const expenseAmount = document.getElementById('expense-amount');
            const addTransactionBtn = document.getElementById('add-transaction-btn');
            const transactionModal = document.getElementById('transaction-modal');
            const closeModalBtn = document.querySelector('.close-btn');
            const filterCategory = document.getElementById('filter-category');
            const filterType = document.getElementById('filter-type');
            const themeSwitch = document.getElementById('theme-switch');
            const nameError = document.getElementById('name-error');
            const amountError = document.getElementById('amount-error');
            const expenseChartCtx = document.getElementById('expense-chart')?.getContext('2d');

            // State
            let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            let expenseChart = null;

            // Initialize app
            init();

            function init() {
                // Load theme preference
                const savedTheme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', savedTheme);
                themeSwitch.checked = savedTheme === 'dark';

                // Load transactions
                updateTransactions();
                updateBalance();
                updateChart();

                // Set default date to today
                transactionDate.valueAsDate = new Date();
            }

            // Event Listeners
            transactionForm.addEventListener('submit', addTransaction);
            addTransactionBtn.addEventListener('click', () => {
                transactionModal.classList.add('show');
                document.body.style.overflow = 'hidden';
            });
            closeModalBtn.addEventListener('click', () => {
                transactionModal.classList.remove('show');
                document.body.style.overflow = '';
            });
            filterCategory.addEventListener('change', updateTransactions);
            filterType.addEventListener('change', updateTransactions);
            themeSwitch.addEventListener('change', toggleTheme);

            // Close modal when clicking outside
            window.addEventListener('click', (e) => {
                if (e.target === transactionModal) {
                    transactionModal.classList.remove('show');
                    document.body.style.overflow = '';
                }
            });

            // Form validation
            transactionName.addEventListener('input', () => {
                if (transactionName.value.trim() === '') {
                    nameError.textContent = 'Description is required';
                } else {
                    nameError.textContent = '';
                }
            });

            transactionAmount.addEventListener('input', () => {
                if (transactionAmount.value === '') {
                    amountError.textContent = 'Amount is required';
                } else if (parseFloat(transactionAmount.value) <= 0) {
                    amountError.textContent = 'Amount must be greater than 0';
                } else {
                    amountError.textContent = '';
                }
            });

            // Functions
            function addTransaction(e) {
                e.preventDefault();

                // Validate form
                if (transactionName.value.trim() === '') {
                    nameError.textContent = 'Description is required';
                    return;
                }

                if (transactionAmount.value === '') {
                    amountError.textContent = 'Amount is required';
                    return;
                }

                if (parseFloat(transactionAmount.value) <= 0) {
                    amountError.textContent = 'Amount must be greater than 0';
                    return;
                }

                // Get form values
                const name = transactionName.value.trim();
                const amount = parseFloat(transactionAmount.value);
                const category = transactionCategory.value;
                const type = document.querySelector('input[name="transaction-type"]:checked').value;
                const date = transactionDate.value;

                // Create transaction object
                const transaction = {
                    id: Date.now(),
                    name,
                    amount,
                    category,
                    type,
                    date
                };

                // Add to transactions array
                transactions.push(transaction);

                // Save to local storage
                saveTransactions();

                // Update UI
                updateTransactions();
                updateBalance();
                updateChart();

                // Reset form
                transactionForm.reset();
                transactionDate.valueAsDate = new Date();
                nameError.textContent = '';
                amountError.textContent = '';

                // Close modal
                transactionModal.classList.remove('show');
                document.body.style.overflow = '';
            }

            function deleteTransaction(id) {
                if (confirm('Are you sure you want to delete this transaction?')) {
                    transactions = transactions.filter(transaction => transaction.id !== id);
                    saveTransactions();
                    updateTransactions();
                    updateBalance();
                    updateChart();
                }
            }

            function updateTransactions() {
                // Clear current transactions
                transactionList.innerHTML = '';

                // Get filter values
                const categoryFilter = filterCategory.value;
                const typeFilter = filterType.value;

                // Filter transactions
                let filteredTransactions = [...transactions];
                
                if (categoryFilter !== 'all') {
                    filteredTransactions = filteredTransactions.filter(
                        transaction => transaction.category === categoryFilter
                    );
                }

                if (typeFilter !== 'all') {
                    filteredTransactions = filteredTransactions.filter(
                        transaction => transaction.type === typeFilter
                    );
                }

                // Sort by date (newest first)
                filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

                // Add transactions to DOM
                if (filteredTransactions.length === 0) {
                    transactionList.innerHTML = `
                        <li class="transaction-item fade-in" style="justify-content: center; background: transparent;">
                            <div style="text-align: center; color: var(--gray);">
                                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px;"></i>
                                <p>No transactions found</p>
                            </div>
                        </li>
                    `;
                    return;
                }

                filteredTransactions.forEach(transaction => {
                    const li = document.createElement('li');
                    li.className = `transaction-item ${transaction.type} fade-in`;
                    li.innerHTML = `
                        <div class="transaction-info">
                            <div class="transaction-name">
                                <i class="fas ${getCategoryIcon(transaction.category)} ${transaction.category}-icon"></i>
                                ${transaction.name}
                            </div>
                            <div class="transaction-category">
                                ${capitalizeFirstLetter(transaction.category)}
                            </div>
                            <div class="transaction-date">${formatDate(transaction.date)}</div>
                        </div>
                        <div class="transaction-amount ${transaction.type}">
                            ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                        </div>
                        <div class="transaction-actions">
                            <button class="action-btn edit-btn" data-id="${transaction.id}" aria-label="Edit transaction">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" data-id="${transaction.id}" aria-label="Delete transaction">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;

                    // Add event listeners to buttons
                    const deleteBtn = li.querySelector('.delete-btn');
                    deleteBtn.addEventListener('click', () => deleteTransaction(transaction.id));

                    // Add edit functionality (placeholder for now)
                    const editBtn = li.querySelector('.edit-btn');
                    editBtn.addEventListener('click', () => {
                        // Implement edit functionality here
                        alert('Edit functionality will be implemented here');
                    });

                    transactionList.appendChild(li);
                });
            }

            function updateBalance() {
                const income = transactions
                    .filter(transaction => transaction.type === 'income')
                    .reduce((total, transaction) => total + transaction.amount, 0);

                const expense = transactions
                    .filter(transaction => transaction.type === 'expense')
                    .reduce((total, transaction) => total + transaction.amount, 0);

                const balance = income - expense;

                balanceAmount.textContent = `$${balance.toFixed(2)}`;
                incomeAmount.textContent = `+$${income.toFixed(2)}`;
                expenseAmount.textContent = `-$${expense.toFixed(2)}`;
            }

            function updateChart() {
                if (!expenseChartCtx) return;

                // Group expenses by category
                const expensesByCategory = transactions
                    .filter(transaction => transaction.type === 'expense')
                    .reduce((acc, transaction) => {
                        if (!acc[transaction.category]) {
                            acc[transaction.category] = 0;
                        }
                        acc[transaction.category] += transaction.amount;
                        return acc;
                    }, {});

                const categories = Object.keys(expensesByCategory);
                const amounts = Object.values(expensesByCategory);

                // Colors for each category
                const backgroundColors = categories.map(category => {
                    switch(category) {
                        case 'food': return '#ff9e64';
                        case 'shopping': return '#7f5af0';
                        case 'bills': return '#2cb67d';
                        case 'transport': return '#4776e6';
                        case 'entertainment': return '#ef4565';
                        default: return '#6e48aa';
                    }
                });

                // Destroy previous chart if it exists
                if (expenseChart) {
                    expenseChart.destroy();
                }

                // Create new chart
                if (categories.length > 0) {
                    expenseChart = new Chart(expenseChartCtx, {
                        type: 'doughnut',
                        data: {
                            labels: categories.map(capitalizeFirstLetter),
                            datasets: [{
                                data: amounts,
                                backgroundColor: backgroundColors,
                                borderWidth: 0,
                                borderRadius: 6
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '65%',
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        color: '#fffffe',
                                        font: {
                                            family: 'Inter'
                                        },
                                        padding: 20,
                                        usePointStyle: true,
                                        pointStyle: 'circle'
                                    }
                                },
                                tooltip: {
                                    backgroundColor: 'rgba(30, 30, 40, 0.9)',
                                    titleColor: '#fffffe',
                                    bodyColor: '#fffffe',
                                    borderColor: 'rgba(255, 255, 254, 0.1)',
                                    borderWidth: 1,
                                    padding: 12,
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.label || '';
                                            const value = context.raw || 0;
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = Math.round((value / total) * 100);
                                            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                } else {
                    // Display message when no expenses
                    const chartContainer = expenseChartCtx.canvas.parentNode;
                    chartContainer.innerHTML = `
                        <div style="text-align: center; color: var(--gray); height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                            <i class="fas fa-chart-pie" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                            <p>No expense data available</p>
                            <p style="font-size: 0.9rem; margin-top: 5px;">Add expenses to see the chart</p>
                        </div>
                    `;
                }
            }

            function saveTransactions() {
                localStorage.setItem('transactions', JSON.stringify(transactions));
            }

            function toggleTheme() {
    const isDark = themeSwitch.checked;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Update chart colors if it exists
    if (expenseChart) {
        updateChart();
    }
}

            // Helper functions
            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }

            function formatDate(dateString) {
                const options = { year: 'numeric', month: 'short', day: 'numeric' };
                return new Date(dateString).toLocaleDateString(undefined, options);
            }

            function getCategoryIcon(category) {
                switch(category) {
                    case 'food': return 'fa-utensils';
                    case 'shopping': return 'fa-shopping-bag';
                    case 'bills': return 'fa-file-invoice-dollar';
                    case 'transport': return 'fa-car';
                    case 'entertainment': return 'fa-film';
                    case 'income': return 'fa-money-bill-wave';
                    default: return 'fa-tag';
                }
            }
        });
   