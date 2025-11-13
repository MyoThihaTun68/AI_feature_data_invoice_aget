import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient'; // Adjust path if needed
import { User, Key, Trash2, Loader2, CheckCircle, AlertTriangle, Mail } from 'lucide-react';

const SettingsPage = () => {
  // State for loading initial data
  const [loading, setLoading] = useState(true);
  
  // State for form inputs
  const [userEmail, setUserEmail] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notiMail, setNotiMail] = useState(''); // <-- NEW state for notification email

  // State for handling feedback (e.g., "Saving...", "Success!", "Error!")
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch all user data when the page loads
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found.");

        setUserEmail(user.email);

        // Fetch profile name
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError);
        }
        if (profile) {
          setName(profile.name || '');
        }

        // --- NEW: Fetch the notification email from the most recent invoice ---
        const { data: latestInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .select('notimail')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (invoiceError && invoiceError.code !== 'PGRST116') { // Ignore 'row not found' error
          console.error("Error fetching notification email:", invoiceError);
        }
        if (latestInvoice) {
          setNotiMail(latestInvoice.notimail || '');
        }

      } catch (error) {
        console.error("Could not fetch user data:", error.message);
        setErrorMessage("Could not load your data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // Helper function to show a feedback message and then hide it
  const showFeedback = (setter, message) => {
    setter(message);
    setTimeout(() => setter(''), 3000);
  };

  // Function to handle updating the user's name
  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showFeedback(setErrorMessage, "You must be logged in.");
        setIsSaving(false);
        return;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, name: name, updated_at: new Date() });
      
    if (error) {
      showFeedback(setErrorMessage, `Failed to update name: ${error.message}`);
    } else {
      showFeedback(setSuccessMessage, "Your name has been updated successfully.");
    }
    setIsSaving(false);
  };

  // --- NEW: Function to update the notification email on ALL user invoices ---
  const handleNotiMailUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Optional: Basic email validation
    if (notiMail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notiMail)) {
        showFeedback(setErrorMessage, "Please enter a valid email address.");
        setIsSaving(false);
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showFeedback(setErrorMessage, "Authentication error.");
        setIsSaving(false);
        return;
    }

    // This updates the 'notimail' column for every invoice belonging to the current user
    const { error } = await supabase
      .from('invoices')
      .update({ notimail: notiMail })
      .eq('user_id', user.id);

    if (error) {
      showFeedback(setErrorMessage, `Failed to update notification email: ${error.message}`);
    } else {
      showFeedback(setSuccessMessage, "Notification email updated for all invoices.");
    }
    setIsSaving(false);
  };

  // Function to handle password updates
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
        showFeedback(setErrorMessage, "Password must be at least 6 characters long.");
        return;
    }
    setIsSaving(true);
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      showFeedback(setErrorMessage, `Failed to update password: ${error.message}`);
    } else {
      showFeedback(setSuccessMessage, "Your password has been updated successfully.");
      setNewPassword('');
    }
    setIsSaving(false);
  };

  // Function to handle the deletion of all user's invoices
  const handleDeleteInvoices = async () => {
    if (window.confirm("Are you absolutely sure you want to delete ALL your invoices? This action cannot be undone.")) {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showFeedback(setErrorMessage, "Authentication required.");
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        showFeedback(setErrorMessage, "Failed to delete invoices.");
      } else {
        showFeedback(setSuccessMessage, "All your invoices have been permanently deleted.");
      }
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-white"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 text-white">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* --- Profile Settings Section --- */}
      <div className="bg-[#24272C] p-6 rounded-xl border border-slate-800">
        <h2 className="text-xl font-semibold mb-4 flex items-center"><User size={20} className="mr-3" />Profile Information</h2>
        <form onSubmit={handleNameUpdate} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-400">Email Address</label>
            <p className="mt-1 text-gray-300">{userEmail}</p>
          </div>
          <div>
            <label htmlFor="name" className="text-sm font-medium text-gray-400">Full Name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 p-2 bg-[#1A1B1E] border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:outline-none"
              placeholder="Your Name" />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-gray-700 hover:bg-gray-500 rounded-lg font-semibold disabled:opacity-50 transition-colors">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* --- NEW: Notification Email Section --- */}
      <div className="bg-[#24272C] p-6 rounded-xl border border-slate-800">
        <h2 className="text-xl font-semibold mb-4 flex items-center"><Mail size={20} className="mr-3" />Notification Settings</h2>
        <form onSubmit={handleNotiMailUpdate} className="space-y-4">
          <div>
            <label htmlFor="notiMail" className="text-sm font-medium text-gray-400">Admin/Notification Email</label>
            <p className="text-xs text-gray-500 mb-1">This email will be stored on every invoice record.</p>
            <input id="notiMail" type="email" value={notiMail} onChange={(e) => setNotiMail(e.target.value)}
              className="w-full mt-1 p-2 bg-[#1A1B1E] border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:outline-none"
              placeholder="admin@example.com" />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-gray-700 hover:bg-gray-500 rounded-lg font-semibold disabled:opacity-50 transition-colors">
              {isSaving ? 'Saving...' : 'Save Email'}
            </button>
          </div>
        </form>
      </div>

      {/* --- Security Settings Section --- */}
      <div className="bg-[#24272C] p-6 rounded-xl border border-slate-800">
        <h2 className="text-xl font-semibold mb-4 flex items-center"><Key size={20} className="mr-3" />Change Password</h2>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-400">New Password</label>
            <input id="password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mt-1 p-2 bg-[#1A1B1E] border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:outline-none"
              placeholder="Enter a new secure password" />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-gray-700 hover:bg-gray-500 rounded-lg font-semibold disabled:opacity-50 transition-colors">
              {isSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* --- Danger Zone Section --- */}
      <div className="bg-[#24272C] p-6 rounded-xl border border-red-500/30">
        <h2 className="text-xl font-semibold mb-2 text-red-400 flex items-center"><Trash2 size={20} className="mr-3" />Danger Zone</h2>
        <p className="text-sm text-gray-400 mb-4">This action is permanent and cannot be undone.</p>
        <div className="flex">
          <button onClick={handleDeleteInvoices} disabled={isSaving} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold disabled:opacity-50 transition-colors">
            {isSaving ? 'Deleting...' : 'Delete All Invoices'}
          </button>
        </div>
      </div>
      
      {/* --- Floating Feedback Toasts --- */}
      {successMessage && (
        <div className="fixed bottom-5 right-5 flex items-center bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-bottom-5">
          <CheckCircle size={20} className="mr-3" /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed bottom-5 right-5 flex items-center bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-bottom-5">
          <AlertTriangle size={20} className="mr-3" /> {errorMessage}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;