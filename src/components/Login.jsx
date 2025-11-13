import React, { useState } from 'react';
import { Music } from 'lucide-react';

const Login = ({ onLogin, onSignup, instrumentSlots }) => {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState({ username: '', password: '', instrument: '' });

  const handleLogin = (e) => {
    e.preventDefault();
    onLogin(loginForm);
  };

  const handleSignup = (e) => {
    e.preventDefault();
    onSignup(signupForm);
    setSignupForm({ username: '', password: '', instrument: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <Music className="w-12 h-12 text-purple-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-800">Music4Chalemine</h1>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Connexion</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Pseudo"
              value={loginForm.username}
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
              Se connecter
            </button>
          </form>
        </div>
        
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Inscription</h2>
          <form onSubmit={handleSignup} className="space-y-4">
            <input
              type="text"
              placeholder="Pseudo"
              value={signupForm.username}
              onChange={(e) => setSignupForm({...signupForm, username: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={signupForm.password}
              onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <select
              value={signupForm.instrument}
              onChange={(e) => setSignupForm({...signupForm, instrument: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Sélectionner un instrument</option>
              {instrumentSlots.map(slot => (
                <option key={slot.id} value={slot.id}>
                  {slot.icon} {slot.name}
                </option>
              ))}
            </select>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
              S'inscrire
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
