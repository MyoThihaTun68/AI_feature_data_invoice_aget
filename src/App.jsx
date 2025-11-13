import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from './config/supabaseClient';
import Sidebar from './components/Sidebar';

const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... (your existing useEffect logic is perfect and needs no changes)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate('/auth');
        } else {
          setUser(session.user);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);


  if (loading) {
    // ... loading state
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <p className="text-white">Loading...</p>
        </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#01101d]">
      {/* --- Pass the 'user' object as a prop to the Sidebar --- */}
      <Sidebar user={user} />

      <main className="flex-1 p-6 overflow-auto flex-grow w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default App;