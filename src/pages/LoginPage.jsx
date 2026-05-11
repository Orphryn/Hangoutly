import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    navigate("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <h1 className="text-center text-4xl font-bold">Welcome Back</h1>

        <p className="mt-2 text-center text-slate-400">
          Log in to keep planning with your people.
        </p>

        <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-violet-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-violet-500"
          />

          <button
            type="submit"
            className="rounded-xl bg-violet-600 p-3 font-semibold transition hover:bg-violet-500"
          >
            Login
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-red-400">{message}</p>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Don’t have an account?{" "}
          <Link to="/signup" className="font-semibold text-violet-400">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}