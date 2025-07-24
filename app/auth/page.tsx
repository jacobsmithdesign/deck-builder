"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async () => {
    setError(null);

    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({
        email,
        password,
      });
    } else {
      result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }

    const { data, error } = result;

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-light text-dark">
      <div className="max-w-md mx-auto mt-20 bg-light">
        <h2 className="text-2xl font-semibold mb-4">
          {isSignUp ? "Sign Up" : "Sign In"}
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 mb-2 border rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 mb-4 border rounded"
        />
        <button
          onClick={handleAuth}
          className="w-full bg-blue-600 text-white py-2 rounded cursor-pointer md:hover:bg-blue-500 transition-all duration-100 "
        >
          {isSignUp ? "Create Account" : "Log In"}
        </button>
        <div className="flex gap-2">
          <p className="mt-4 text-sm text-dark cursor-pointer">
            {isSignUp ? "Already have an account?" : "New to Deck Builder?"}
          </p>
          <p
            onClick={() => setIsSignUp(!isSignUp)}
            className="mt-4 text-sm text-blue-500 cursor-pointer"
          >
            {isSignUp ? "Log In" : "Create an account"}
          </p>
        </div>
      </div>
    </div>
  );
}
