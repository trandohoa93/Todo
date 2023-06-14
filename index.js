const getURLHash = () => document.location.hash.replace(/^#\//, "");
const filterNotCompletedTodos = (todos) =>
  todos.filter((todo) => !todo.completed);

function createTodoItemEl({ value, id, completed }) {
  const li = document.createElement("li");
  li.dataset.id = id;
  li.className = "py-4 group";
  li.insertAdjacentHTML(
    "afterbegin",
    ` 
      <div class="flex items-center justify-between">
                <div class="flex items-center w-full">
                  <input id="todo1" name="todo1" type="checkbox" data-todo="toggle" ${
                    completed ? "checked" : ""
                  }
                    class="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded">
                  <div for="todo1" class="ml-3 block text-gray-900 text-lg font-medium ${
                    completed ? "line-through" : ""
                  }" data-todo="value" contenteditable="true">
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" data-todo="remove" class="h-5 w-5 text-red-600 ml-2 cursor-pointer invisible group-hover:visible "
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </div>
    `
  );
  li.querySelector('[data-todo="value"]').textContent = value;
  return li;
}

async function App() {
  const TODO_APP_URL = "https://64106f42be7258e14529c12f.mockapi.io";
  let todos = [];
  const inputEl = document.getElementById("input");
  const listEl = document.getElementById("list");
  const countEl = document.getElementById("count");
  const eventTarget = new EventTarget();

  const fetchTodos = async () => {
    try {
      const res = await fetch(`${TODO_APP_URL}/todos`);
      const data = await res.json();
      todos = data;
    } catch (error) {
      console.error(error);
    }
  };

  function renderTodos() {
    const filter = getURLHash();
    let filterTodos = [...todos];
    if (filter === "active") filterTodos = filterNotCompletedTodos(todos);
    else if (filter === "completed")
      filterTodos = todos.filter((todo) => todo.completed);
    countEl.innerHTML = `${filterNotCompletedTodos(todos).length} Items left`;
    listEl.replaceChildren(
      ...filterTodos.map((todo) => createTodoItemEl(todo))
    );
    document.querySelectorAll('[data-todo="filters"] a').forEach((el) => {
      if (el.matches(`[href="#/${filter}"]`)) {
        el.classList.add("checked");
      } else {
        el.classList.remove("checked");
      }
    });
  }

  const createTodo = async ({ value, completed }) => {
    try {
      const res = await fetch(`${TODO_APP_URL}/todos`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value, completed }),
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  const updateTodo = async ({ id, value, completed }) => {
    try {
      await fetch(`${TODO_APP_URL}/todos/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value, completed }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  // create
  document.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (inputEl.value.trim() !== "") {
      try {
        const newTodo = await createTodo({
          value: inputEl.value,
          completed: false,
        });
        todos.push(newTodo);
        eventTarget.dispatchEvent(new CustomEvent("save"));
      } catch (error) {
        console.error(error);
      }
    }
  });

  // tick
  listEl.addEventListener("click", async (e) => {
    const target = e.target;
    if (target.matches('[data-todo="toggle"]')) {
      try {
        const el = target.closest("[data-id]");
        const todo = todos.find((todo) => todo.id === el.dataset.id);
        await updateTodo({ ...todo, completed: !todo.completed });
        todos = todos.map((todo) =>
          todo.id === el.dataset.id
            ? { ...todo, completed: !todo.completed }
            : todo
        );
        eventTarget.dispatchEvent(new CustomEvent("save"));
      } catch (error) {
        console.error(error);
      }
    }
  });
  // delete
  listEl.addEventListener("click", async (e) => {
    const target = e.target;
    if (target.matches('[data-todo="remove"]')) {
      const el = target.closest("[data-id]");
      await fetch(`${TODO_APP_URL}/todos/${el?.dataset?.id}`, {
        method: "DELETE",
      });
      todos = todos.filter((todo) => todo.id !== el.dataset.id);
      eventTarget.dispatchEvent(new CustomEvent("save"));
    }
  });

  // update
  listEl.addEventListener("keydown", async (e) => {
    const target = e.target;
    if (target.matches('[data-todo="value"]')) {
      const el = target.closest("[data-id]");
      if (e.keyCode === 13) {
        e.preventDefault();
        const content = el.querySelector('[data-todo="value"]').textContent;
        const todo = todos.find((todo) => todo.id === el.dataset.id);
        await updateTodo({ ...todo, value: content });
        todos = todos.map((todo) =>
          todo.id === el.dataset.id ? { ...todo, value: content } : todo
        );
        eventTarget.dispatchEvent(new CustomEvent("save"));
      }
    }
  });

  eventTarget.addEventListener("save", () => {
    renderTodos();
  });
  window.addEventListener("hashchange", () => {
    renderTodos();
  });
  await fetchTodos();
  renderTodos();
}
App();
