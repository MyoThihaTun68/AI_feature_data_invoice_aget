import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient.js';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // --- SIGN IN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // --- SIGN UP ---
        // This is the simplified, correct logic. We no longer manually insert a user record.
        // The database trigger we created in Step 1 handles that automatically and reliably.
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // We pass the username in the metadata. The database trigger will read this.
            data: {
              username: username,
            },
          },
        });
        if (error) throw error;
      }

      // If either sign-in or sign-up is successful, navigate to the dashboard.
      navigate('/dashboard');

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-slate-900 text-white">
      <div className="w-full max-w-md mx-auto">
        {/* Logo and App Name */}
        <div className="flex justify-center items-center mb-6">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          <h1 className="ml-2 text-2xl font-bold text-slate-200">FinDash AI</h1>
        </div>

        <div className="p-8 space-y-6 bg-slate-800 border rounded-lg shadow-lg border-slate-700">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">
              {isLogin ? 'Welcome Back' : 'Create your Account'}
            </h2>
            <p className="mt-2 text-slate-400">
              {isLogin ? 'Sign in to access your dashboard' : 'It’s quick and easy.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-slate-300"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 mt-1 text-white placeholder-slate-400 transition duration-300 bg-slate-700 border rounded-md shadow-sm border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Choose a username"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 mt-1 text-white placeholder-slate-400 transition duration-300 bg-slate-700 border rounded-md shadow-sm border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 mt-1 text-white placeholder-slate-400 transition duration-300 bg-slate-700 border rounded-md shadow-sm border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            {error && <p className="text-sm text-center text-red-400">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center w-full px-4 py-3 font-semibold text-white transition duration-300 transform rounded-md shadow-sm bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                {loading && (
                  <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}</span>
              </button>
            </div>
          </form>

          <p className="text-sm text-center text-slate-400">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setUsername('');
                setPassword('');
              }}
              className="ml-1 font-semibold text-indigo-400 hover:underline focus:outline-none"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
        <p className="mt-6 text-xs text-center text-slate-500">
            © {new Date().getFullYear()} FinDash AI. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;