import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import clsx from 'clsx';

import { useSidebarAnimation } from '../hooks/useSidebarAnimation';
import { useHoverAnimation } from '../hooks/useHoverAnimation';

import {
  LayoutDashboard, FileText, BarChart2, Settings, LifeBuoy, LogOut, UserCircle2, Menu, X
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('Loading...');
  const [email, setEmail] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  useSidebarAnimation(sidebarRef);
  useHoverAnimation(sidebarRef, '.hover-target');

  useEffect(() => {
    // ... your user fetching logic remains exactly the same
    const fetchUserProfile = async () => {
      setLoadingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email);
        const { data: profile, error } = await supabase.from('profiles').select('name').eq('id', user.id).single();
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching profile for sidebar:", error);
          setUsername('User');
        } else if (profile) { setUsername(profile.name || user.email); }
        else { setUsername(user.email); }
      } else { setUsername('Anonymous'); }
      setLoadingProfile(false);
    };
    fetchUserProfile();
    const profileListener = supabase.channel('public:profiles').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, fetchUserProfile).subscribe();
    return () => supabase.removeChannel(profileListener);
  }, []);
  
  useEffect(() => {
    if (isOpen) setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <>
      {/* --- HAMBURGER MENU BUTTON (no changes) --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-5 z-50 p-2 bg-[#1f2024] rounded-md text-white"
        aria-label="Open sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* --- OVERLAY (no changes) --- */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}

      {/* --- YOUR SIDEBAR WITH CORRECTED POSITIONING --- */}
      <aside
        ref={sidebarRef}
        className={clsx(
          // --- Base (Mobile) Styles ---
          // It's a fixed overlay that slides in.
          "fixed top-0 left-0 h-full z-40 flex flex-col w-64 px-4 py-8 bg-[#101113] border-r border-gray-800 transition-transform duration-300 ease-in-out",
          { "-translate-x-full": !isOpen }, // Hide off-screen if closed

          // --- Desktop Overrides (The Fix) ---
          // On medium screens and up, change position to static.
          "md:static md:h-screen md:translate-x-0"
        )}
      >
        {/* All of your original sidebar content remains exactly the same below */}
        <div className="flex items-center px-2 mb-10 app-logo">
          <div className="flex items-center justify-center w-10 h-10 bg-teal-500 rounded-full">
            <span className="font-bold text-teal-900">FA</span>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-bold text-gray-200">Data Entry AI</h3>
            <p className="text-xs text-gray-500">Invoice Agent</p>
          </div>
        </div>

        <div className="flex flex-col justify-between flex-1">
          
        <nav className="flex-grow">
          <ul className="space-y-2">
            {/* Add 'nav-link' for entrance animation AND 'hover-target' for hover animation */}
            <li className="nav-link">
              <NavLink to="/dashboard" className={({isActive}) => `flex items-center w-full px-4 py-2.5 rounded-lg transition-colors duration-200 hover-target ${isActive ? 'bg-[#2D2E35] text-white' : 'text-gray-400 hover:bg-[#1f2024] hover:text-gray-200'}`}>
                <LayoutDashboard size={20} /> <span className="text-white ml-3">Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-link">
              <NavLink to="/invoices" className={({isActive}) => `flex items-center w-full px-4 py-2.5 rounded-lg transition-colors duration-200 hover-target ${isActive ? 'bg-[#2D2E35] text-white' : 'text-gray-400 hover:bg-[#1f2024] hover:text-gray-200'}`}>
                <FileText size={20} /> <span className="ml-3 text-white">Invoices</span>
              </NavLink>
            </li>
            <li className="nav-link">
              <NavLink to="/analytics" className={({isActive}) => `flex items-center w-full px-4 py-2.5 rounded-lg transition-colors duration-200 hover-target ${isActive ? 'bg-[#2D2E35] text-white' : 'text-gray-400 hover:bg-[#1f2024] hover:text-gray-200'}`}>
                <BarChart2 size={20} /> <span className="ml-3 text-white">Analytics</span>
              </NavLink>
            </li>
            <li className="nav-link">
              <NavLink to="/settings" className={({isActive}) => `flex items-center w-full px-4 py-2.5 rounded-lg transition-colors duration-200 hover-target ${isActive ? 'bg-[#2D2E35] text-white' : 'text-gray-400 hover:bg-[#1f2024] hover:text-gray-200'}`}>
                <Settings size={20} /> <span className="ml-3 text-white">Settings</span>
              </NavLink>
            </li>
          </ul>
        </nav>
          <div>
            <div className="p-2 mb-4 rounded-lg bg-[#1f2024] user-profile">
              <div className="flex items-center">
                <UserCircle2 size={40} className="text-gray-400" />
                <div className="ml-3 overflow-hidden">
                  {loadingProfile ? (
                    <div className="h-4 w-24 bg-gray-700 rounded-md animate-pulse"></div>
                  ) : (
                    <p className="text-sm font-semibold text-gray-200 truncate" title={username}>{username}</p>
                  )}
                  <p className="text-xs text-gray-500 truncate" title={email}>{email}</p>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-800">
              <ul className="space-y-2">
                <li className="bottom-link">
                  <a href="#" className="flex items-center px-4 py-2.5 text-gray-400 rounded-lg hover:bg-[#1f2024] hover:text-gray-200 hover-target">
                    <LifeBuoy size={20} /> <span className="ml-3">Support</span>
                  </a>
                </li>
                <li className="bottom-link">
                  <button onClick={handleLogout} className="flex items-center w-full px-4 py-2.5 text-gray-400 rounded-lg hover:bg-[#1f2024] hover:text-gray-200 hover-target">
                    <LogOut size={20} /> <span className="ml-3">Log Out</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;






