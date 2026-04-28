"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, LogOut, Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Todo = {
  id: number;
  title: string;
  is_completed: boolean;
  user_id: number;
};

type Filter = "all" | "active" | "completed";

function logApiError(context: string, err: unknown) {
  console.error(`[Todo API] ${context}`, err);
}

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [submitting, setSubmitting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadTodos = useCallback(async () => {
    if (!user) return;
    setTodosLoading(true);
    setSyncError(null);
    setLoadFailed(false);
    try {
      const { data } = await api.get<Todo[]>("/todos/");
      setTodos(data);
    } catch (err) {
      logApiError("GET /todos/", err);
      setLoadFailed(true);
      setSyncError(
        "Could not load tasks. Check that the server is running and try again.",
      );
    } finally {
      setTodosLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const remainingCount = useMemo(
    () => todos.filter((t) => !t.is_completed).length,
    [todos],
  );

  const filteredTodos = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.is_completed);
    if (filter === "completed") return todos.filter((t) => t.is_completed);
    return todos;
  }, [todos, filter]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post<Todo>("/todos/", { title });
      setNewTitle("");
      setTodos((prev) => [...prev, data]);
      setSyncError(null);
    } catch (err) {
      logApiError("POST /todos/", err);
      setSyncError("Could not create task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleComplete(todo: Todo) {
    try {
      const { data } = await api.put<Todo>(`/todos/${todo.id}`, {
        is_completed: !todo.is_completed,
      });
      setTodos((prev) => prev.map((t) => (t.id === data.id ? data : t)));
      setSyncError(null);
    } catch (err) {
      logApiError(`PUT /todos/${todo.id}`, err);
      setSyncError("Could not update task. Please try again.");
    }
  }

  async function deleteTodo(id: number) {
    try {
      await api.delete(`/todos/${id}`);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setSyncError(null);
    } catch (err) {
      logApiError(`DELETE /todos/${id}`, err);
      setSyncError("Could not delete task. Please try again.");
    }
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-100">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <header className="sticky top-0 z-20 -mx-4 mb-8 border-b border-gray-800/90 bg-gray-950/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Todo
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                {remainingCount === 1
                  ? "1 task remaining"
                  : `${remainingCount} tasks remaining`}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="truncate text-xs text-gray-500 sm:max-w-[200px] sm:text-right">
                {user?.email}
              </p>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-900/80 px-4 py-2.5 text-sm font-medium text-gray-200 transition-all duration-200 hover:border-gray-600 hover:bg-gray-800 hover:text-white"
              >
                <LogOut className="h-4 w-4 opacity-80" aria-hidden />
                Log out
              </button>
            </div>
          </div>
        </header>

        {syncError ? (
          <div
            className="mb-6 rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100/90"
            role="alert"
          >
            <p>{syncError}</p>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              className="mt-2 text-xs font-medium text-amber-200/80 underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <section className="mb-8">
          <form
            onSubmit={handleAdd}
            className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="min-h-[48px] flex-1 rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-3 text-base text-white shadow-lg shadow-black/20 outline-none transition-all duration-200 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !newTitle.trim()}
              className="group inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all duration-200 hover:scale-[1.02] hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:px-6"
            >
              <Plus className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              Add
            </button>
          </form>
        </section>

        <section className="mb-6">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "all" as const, label: "All" },
                { key: "active" as const, label: "Active" },
                { key: "completed" as const, label: "Completed" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  filter === key
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                    : "bg-gray-800/80 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section
          className="todo-scroll max-h-[min(60vh,520px)] space-y-3 overflow-y-auto pr-1 sm:max-h-[min(65vh,600px)]"
          aria-busy={todosLoading}
        >
          {todosLoading ? (
            <ul className="space-y-3">
              {[1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-gray-900/80"
                />
              ))}
            </ul>
          ) : todos.length === 0 && loadFailed ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-6 py-12 text-center text-gray-400">
              Tasks could not be loaded. Check the message above or refresh the
              page.
            </div>
          ) : todos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-16 text-center">
              <p className="text-lg text-gray-400">No tasks yet 🚀</p>
              <p className="mt-2 text-sm text-gray-500">
                Add your first task above to get started.
              </p>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-6 py-12 text-center text-gray-400">
              No tasks in this view.
            </div>
          ) : (
            <ul className="space-y-3 pb-2">
              {filteredTodos.map((todo) => (
                <li
                  key={todo.id}
                  className="group relative rounded-xl border border-gray-800/90 bg-gray-900/50 shadow-md shadow-black/20 transition-all duration-200 hover:border-gray-700 hover:bg-gray-900/80"
                >
                  <div className="flex items-start gap-3 p-4 sm:items-center sm:gap-4">
                    <button
                      type="button"
                      onClick={() => void toggleComplete(todo)}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 sm:mt-0 ${
                        todo.is_completed
                          ? "border-indigo-500 bg-indigo-600 text-white"
                          : "border-gray-600 bg-gray-950 hover:border-indigo-400"
                      }`}
                      aria-pressed={todo.is_completed}
                      aria-label={
                        todo.is_completed ? "Mark as active" : "Mark as completed"
                      }
                    >
                      {todo.is_completed ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-base leading-snug transition-all duration-200 ${
                          todo.is_completed
                            ? "text-gray-500 line-through opacity-60"
                            : "text-gray-100"
                        }`}
                      >
                        {todo.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteTodo(todo.id)}
                      className="shrink-0 rounded-lg p-2 text-gray-500 opacity-60 transition-all duration-200 hover:bg-red-950/50 hover:text-red-400 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500/40 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-10 text-center text-xs text-gray-600">
          <Link
            href="/login"
            className="text-gray-500 underline-offset-2 hover:text-gray-400 hover:underline"
          >
            Switch account
          </Link>
        </p>
      </div>
    </div>
  );
}
