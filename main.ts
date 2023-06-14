const getURLHash = () => document.location.hash.replace(/^#\//, '');

interface Todo {
    value: string;
    id: string;
    completed: boolean;
}

const filterNotCompletedTodos = (todos: any) => todos.filter((todo: any) => !todo.completed);

function createTodoItemEl({ value, id, completed }: Todo) {
    const li: HTMLElement = document.createElement('li');
    li.dataset.id = id.toString();
    li.className = 'py-4 group';
    li.insertAdjacentHTML(
        'afterbegin',
        ` 
      <div class="flex items-center justify-between">
                <div class="flex items-center w-full">
                  <input id="todo1" name="todo1" type="checkbox" data-todo="toggle" ${completed ? 'checked' : ''}
                    class="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded">
                  <div for="todo1" class="ml-3 block text-gray-900 text-lg font-medium ${
                      completed ? 'line-through' : ''
                  }" data-todo="value" contenteditable="true">
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" data-todo="remove" class="h-5 w-5 text-red-600 ml-2 cursor-pointer invisible group-hover:visible "
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </div>
    `,
    );
    li.querySelector('[data-todo="value"]')!.textContent = value;
    return li;
}

async function App() {
    const TODO_APP_URL = 'https://64106f42be7258e14529c12f.mockapi.io';
    let todos: Todo[] = [];
    const inputEl: HTMLInputElement | null = document.getElementById('input') as HTMLInputElement;
    const listEl = document.getElementById('list');
    const countEl = document.getElementById('count');
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
        if (filter === 'active') filterTodos = filterNotCompletedTodos(todos);
        else if (filter === 'completed') filterTodos = todos.filter((todo) => todo.completed);
        countEl!.innerHTML = `${filterNotCompletedTodos(todos).length} Items left`;
        listEl!.replaceChildren(...filterTodos.map((todo) => createTodoItemEl(todo)));
        document.querySelectorAll('[data-todo="filters"] a').forEach((el) => {
            if (el.matches(`[href="#/${filter}"]`)) {
                el.classList.add('checked');
            } else {
                el.classList.remove('checked');
            }
        });
    }

    const createTodo = async ({ value, completed }: Omit<Todo, 'id'>) => {
        try {
            const res = await fetch(`${TODO_APP_URL}/todos`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ value, completed }),
            });
            const data = await res.json();
            return data;
        } catch (error) {
            console.error(error);
        }
    };

    const updateTodo = async ({ id, value, completed }: Todo) => {
        try {
            await fetch(`${TODO_APP_URL}/todos/${id}`, {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ value, completed }),
            });
        } catch (error) {
            console.error(error);
        }
    };

    // create
    document.querySelector('form')!.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (inputEl.value.trim() !== '') {
            try {
                const newTodo: Todo = await createTodo({
                    value: inputEl.value,
                    completed: false,
                });
                todos.push(newTodo);
                eventTarget.dispatchEvent(new CustomEvent('save'));
            } catch (error) {
                console.error(error);
            }
        }
    });
    // tick
    listEl?.addEventListener('click', async (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target?.matches('[data-todo="toggle"]')) {
            try {
                const el = target.closest('[data-id]') as HTMLElement;
                if (el !== null) {
                    const datasetId = el.dataset.id;
                    if (datasetId !== undefined) {
                        const todo = todos.find((todo) => parseInt(todo.id) === parseInt(datasetId));
                        console.log(todo);
                        if (todo) {
                            await updateTodo({ ...todo, completed: !todo.completed });
                            todos = todos.map((todo) =>
                                parseInt(todo.id) === parseInt(datasetId)
                                    ? { ...todo, completed: !todo.completed }
                                    : todo,
                            );
                            eventTarget.dispatchEvent(new CustomEvent('save'));
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }
    });

    // delete
    listEl?.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        if (target.matches('[data-todo="remove"]')) {
            const el = target.closest('[data-id]') as HTMLElement;
            await fetch(`${TODO_APP_URL}/todos/${el?.dataset?.id}`, {
                method: 'DELETE',
            });
            const datasetId = el.dataset.id;
            if (datasetId !== undefined) {
                todos = todos.filter((todo) => parseInt(todo.id) !== parseInt(datasetId));
            }
            eventTarget.dispatchEvent(new CustomEvent('save'));
            console.log('heh');
        }
    });

    // update
    listEl?.addEventListener('keydown', async (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (target.matches('[data-todo="value"]')) {
            const el = target.closest('[data-id]') as HTMLElement;
            if (e.keyCode === 13) {
                e.preventDefault();
                const content = el.querySelector('[data-todo="value"]')?.textContent ?? '';
                if (content !== undefined) {
                    const datasetId = el.dataset.id;
                    if (datasetId !== undefined) {
                        const todo = todos.find((todo) => parseInt(todo.id) === parseInt(datasetId));
                        if (todo) {
                            await updateTodo({ ...todo, value: content });
                            todos = todos.map((todo) =>
                                parseInt(todo.id) === parseInt(datasetId) ? { ...todo, value: content } : todo,
                            );
                            eventTarget.dispatchEvent(new CustomEvent('save'));
                        }
                    }
                }
            }
        }
    });

    eventTarget.addEventListener('save', () => {
        renderTodos();
    });
    window.addEventListener('hashchange', () => {
        renderTodos();
    });
    await fetchTodos();
    renderTodos();
}
App();
