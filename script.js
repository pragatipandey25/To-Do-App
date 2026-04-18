const STORAGE_KEY = "todo-app-items";

const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const itemsLeft = document.getElementById("itemsLeft");
const filterGroup = document.getElementById("filterGroup");
const clearCompletedButton = document.getElementById("clearCompleted");

let todos = loadTodos();
let currentFilter = "all";

renderTodos();

todoForm.addEventListener("submit", (event) => {
	event.preventDefault();

	const text = todoInput.value.trim();
	if (!text) {
		return;
	}

	todos.unshift({
		id: crypto.randomUUID(),
		text,
		completed: false,
		createdAt: Date.now(),
	});

	todoInput.value = "";
	saveTodos();
	renderTodos();
});

todoList.addEventListener("click", (event) => {
	const target = event.target;
	if (!(target instanceof HTMLElement)) {
		return;
	}

	const actionButton = target.closest("[data-action]");
	if (!actionButton) {
		return;
	}

	const action = actionButton.dataset.action;
	const todoItemElement = actionButton.closest("li[data-id]");
	const id = todoItemElement?.dataset.id;
	if (!id) {
		return;
	}

	if (action === "toggle") {
		todos = todos.map((todo) =>
			todo.id === id ? { ...todo, completed: !todo.completed } : todo
		);
	}

	if (action === "delete") {
		todos = todos.filter((todo) => todo.id !== id);
	}

	saveTodos();
	renderTodos();
});

filterGroup.addEventListener("click", (event) => {
	const target = event.target;
	if (!(target instanceof HTMLElement)) {
		return;
	}

	const button = target.closest("button[data-filter]");
	if (!button) {
		return;
	}

	currentFilter = button.dataset.filter || "all";
	renderTodos();
});

clearCompletedButton.addEventListener("click", () => {
	todos = todos.filter((todo) => !todo.completed);
	saveTodos();
	renderTodos();
});

function loadTodos() {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) {
		return [];
	}

	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.filter((todo) => {
			return (
				typeof todo.id === "string" &&
				typeof todo.text === "string" &&
				typeof todo.completed === "boolean"
			);
		});
	} catch {
		return [];
	}
}

function saveTodos() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function getFilteredTodos() {
	if (currentFilter === "active") {
		return todos.filter((todo) => !todo.completed);
	}

	if (currentFilter === "completed") {
		return todos.filter((todo) => todo.completed);
	}

	return todos;
}

function renderTodos() {
	const visibleTodos = getFilteredTodos();
	todoList.innerHTML = "";

	if (visibleTodos.length === 0) {
		const message =
			todos.length === 0
				? "No tasks yet. Add your first task above."
				: "No tasks match this filter.";

		todoList.innerHTML = `<li class="empty-state">${message}</li>`;
	} else {
		const fragment = document.createDocumentFragment();

		visibleTodos.forEach((todo) => {
			const li = document.createElement("li");
			li.className = `todo-item${todo.completed ? " completed" : ""}`;
			li.dataset.id = todo.id;

			li.innerHTML = `
				<div class="todo-main">
					<span class="status-dot" aria-hidden="true"></span>
					<button class="todo-text" type="button" data-action="toggle" aria-label="Toggle task completion">
						${escapeHtml(todo.text)}
					</button>
				</div>
				<button class="icon-btn" type="button" data-action="delete" aria-label="Delete task">Delete</button>
			`;

			fragment.appendChild(li);
		});

		todoList.appendChild(fragment);
	}

	const activeCount = todos.filter((todo) => !todo.completed).length;
	itemsLeft.textContent = String(activeCount);

	clearCompletedButton.disabled = !todos.some((todo) => todo.completed);

	Array.from(filterGroup.querySelectorAll("button[data-filter]")).forEach(
		(button) => {
			button.classList.toggle(
				"is-active",
				button.dataset.filter === currentFilter
			);
		}
	);
}

function escapeHtml(input) {
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
