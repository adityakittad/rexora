import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { X, Lock } from 'lucide-react';
import { toast } from 'sonner';

// ✅ SINGLE SOURCE OF TRUTH
const API =
  (process.env.REACT_APP_BACKEND_URL
    ? process.env.REACT_APP_BACKEND_URL.replace(/\/$/, '')
    : 'http://127.0.0.1:8000') + '/api';

export default function AdminLogin({ onClose, onLoginSuccess }) {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        email: credentials.email.trim(),
        password: credentials.password.trim(),
      };

      console.log('Admin login →', `${API}/admin/login`, payload.email);

      const response = await axios.post(
        `${API}/admin/login`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const token = response?.data?.token;

      if (!token) {
        throw new Error('Token missing in response');
      }

      // ✅ CONSISTENT TOKEN KEY
      localStorage.setItem('rexora_admin_token', token);

      toast.success('Login successful');

      onLoginSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Admin login error:', error);

      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Invalid credentials';

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass-card p-8 rounded-lg max-w-md w-full relative"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#a1a1aa] hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-8">
            <Lock className="w-8 h-8 text-[#D4AF37]" />
            <h2 className="text-2xl font-bold">Admin Login</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-2">Email</label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
                required
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-[#a1a1aa] mb-2">Password</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                required
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
