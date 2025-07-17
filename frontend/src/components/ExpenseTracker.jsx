import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./ExpenseTracker.css";
import BudgetSuggestions from "./BudgetSuggestions";

const APP_URL = import.meta.env.VITE_APP_URL;

function ExpenseTracker() {
  // Get the tripId
  const { tripId } = useParams();

  // State to store expenses and budget
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [events, setEvents] = useState([]);
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });

  // State for tracking if we are editing an expense
  const [editingExpense, setEditingExpense] = useState(null);

  //expense categories
  const categories = [
    "Food",
    "Transport",
    "Lodging",
    "Activities",
    "Shopping",
    "Other",
  ];

  //colors of bars
  const categoryColors = {
    Food: "#FF69B4",
    Transport: "#33CC33",
    Lodging: "#66CCCC",
    Activities: "#FFA07A ",
    Shopping: "#BE2ED6",
    Other: "#F7DC6F",
  };

  // Form state for creating or editing an expense
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: categories[0],
    date: new Date().toISOString().split("T")[0], // today's date in YYYY-MM-DD
    eventId: ""
  });

  // Fetch budget and expenses
  useEffect(() => {
    fetchBudget();
    fetchExpenses();
    fetchEvents();
  }, [tripId]);

  // Fetch the budget for the trip
  const fetchBudget = async () => {
    try {
      const res = await fetch(`${APP_URL}/trips/${tripId}/budget`, {
        credentials: "include",
      });
      const data = await res.json();
      setBudget(data.budget || 0);
    } catch (err) {
      console.error("Error fetching budget:", err);
    }
  };

  // Fetch the list of expenses for the trip
  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${APP_URL}/trips/${tripId}/expenses`, {
        credentials: "include",
      });
      const data = await res.json();
      setExpenses(data || []);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${APP_URL}/trips/${tripId}/events`, {
        credentials: "include",
      });
      const data = await res.json();
      setEvents(data || []);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  //adding or editing an expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, amount, category, date, eventId } = form;

    // Validate inputs
    if (!title || !amount || !category || !date) {
      alert("Please fill in all fields");
      return;
    }

    // Determine whether to create a new expense or update an existing one
    const method = editingExpense ? "PUT" : "POST";
    const url = editingExpense
      ? `${APP_URL}/trips/${tripId}/expenses/${editingExpense.id}`
      : `${APP_URL}/trips/${tripId}/expenses`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          amount: parseFloat(amount),
          category,
          date,
          eventId: eventId || null
        }),
      });

      if (res.ok) {
        // Reset form after successful save
        setForm({
          title: "",
          amount: "",
          category: categories[0],
          date: new Date().toISOString().split("T")[0],
          eventId: ""
        });
        setEditingExpense(null);
        fetchExpenses(); // refresh expense list
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save expense");
      }
    } catch (err) {
      console.error("Error saving expense:", err);
    }
  };

  // Populate form for editing an existing expense
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setForm({
      title: expense.title,
      amount: parseFloat(expense.amount),
      category: expense.category,
      date: expense.date.split("T")[0],
      eventId: expense.eventId || ""
    });
  };

  // Delete an expense
  const handleDelete = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;

    try {
      const res = await fetch(
        `${APP_URL}/trips/${tripId}/expenses/${expenseId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (res.ok) {
        // Remove deleted expense from state
        setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete expense");
      }
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  // Update the trip's budget
  const handleBudgetUpdate = async () => {
    try {
      const res = await fetch(`${APP_URL}/trips/${tripId}/budget`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ budget: parseFloat(budgetInput) }),
      });

      if (res.ok) {
        const data = await res.json();
        setBudget(data.budget);
        setBudgetInput("");
      }
    } catch (err) {
      console.error("Error updating budget:", err);
    }
  };

  // Calculate totals
  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const remaining = budget - totalSpent;

  //Bar Chart Data
  const chartData = categories
    .map((category) => {
      const categoryTotal = expenses
        .filter((exp) => exp.category === category)
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      return { category, total: categoryTotal };
    })
    .filter((item) => item.total > 0);

  return (
    <div className="container">
      <h1>Expense Tracker</h1>

      {/* Budget Section */}
      <div className="section">
        <form
          className="budget-row"
          onSubmit={(e) => {
            e.preventDefault();
            handleBudgetUpdate();
          }}
        >
          <input
            type="number"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            placeholder="Set budget"
          />
          <button type="submit">Save</button>
        </form>

        <div className="budget-info">
          <span>Budget: ${budget.toFixed(2)}</span>
          <span>Spent: ${totalSpent.toFixed(2)}</span>
          <span className={remaining < 0 ? "remaining-neg" : "remaining-pos"}>
            Remaining: ${remaining.toFixed(2)}
          </span>
        </div>
      </div>
      {/* Budget Suggestions */}
      <BudgetSuggestions
        expenses={expenses}
        budget={budget}
        categories={categories}
      />
      {/* Bar Chart Section */}
      {chartData.length > 0 && (
        <div className="section">
          <h3>Expense Breakdown</h3>
          <div className="bar-chart">
            {chartData.map((item) => (
              <div key={item.category} className="bar-row">
                <span className="bar-label">{item.category}</span>
                <div className="bar-container">
                  <div className="bar-amount">${item.total.toFixed(2)}</div>
                  <div
                    className="bar"
                    style={{
                      width: `${(item.total / totalSpent) * 100}%`,
                      backgroundColor: categoryColors[item.category],
                    }}
                    onMouseEnter={(e) => {
                      const breakdown = expenses
                        .filter((exp) => exp.category === item.category)
                        .map(
                          (exp) =>
                            `• ${exp.title}: $${parseFloat(exp.amount).toFixed(
                              2
                            )}`
                        )
                        .join("\n");

                      setTooltip({
                        visible: true,
                        content: breakdown,
                        x: e.clientX + 10,
                        y: e.clientY + 10,
                      });
                    }}
                    onMouseMove={(e) => {
                      setTooltip((prev) => ({
                        ...prev,
                        x: e.clientX + 10,
                        y: e.clientY + 10,
                      }));
                    }}
                    onMouseLeave={() => {
                      setTooltip({ visible: false, content: "", x: 0, y: 0 });
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tooltip.visible && (
        <div className="tooltip" style={{ top: tooltip.y, left: tooltip.x }}>
          {tooltip.content}
        </div>
      )}
      {/* Expense Form */}
      <div className="section">
        <h3>{editingExpense ? "Edit Expense" : "Add Expense"}</h3>
        <form onSubmit={handleSubmit}>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            required
          />
          <input
            name="amount"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="Amount"
            required
          />
          <select name="category" value={form.category} onChange={handleChange}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
          />
          <select 
            name="eventId" 
            value={form.eventId} 
            onChange={handleChange}
            className="event-select"
          >
            <option value="">No associated event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.event} - {new Date(event.date).toLocaleDateString()}
              </option>
            ))}
          </select>
          <div className="form-buttons">
            <button type="submit">{editingExpense ? "Update" : "Add"}</button>
            {editingExpense && (
              <button
                type="button"
                onClick={() => {
                  // Cancel editing and reset form
                  setEditingExpense(null);
                  setForm({
                    title: "",
                    amount: "",
                    category: categories[0],
                    date: new Date().toISOString().split("T")[0],
                    eventId: ""
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Expense List */}
      <div className="section">
        <h3>Expenses</h3>
        {expenses.length === 0 ? (
          <p>No expenses yet</p>
        ) : (
          <div className="expense-list">
            {expenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                <div className="expense-info">
                  <div className="expense-title">{expense.title}</div>
                  <div className="expense-details">
                    ${parseFloat(expense.amount).toFixed(2)} • {expense.category} • {new Date(expense.date).toLocaleDateString()}
                    {expense.event && (
                      <div className="expense-event">
                        🎫 {expense.event.event} @ {expense.event.location}
                      </div>
                    )}
                  </div>
                </div>
                <div className="expense-actions">
                  <button onClick={() => handleEdit(expense)}>Edit</button>
                  <button onClick={() => handleDelete(expense.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpenseTracker;

