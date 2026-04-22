import React from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import ChatLayout from './components/Chat/ChatLayout';
import './App.css';

export default function App() {
  const { currentUser } = useAuth();

  return (
    <div className="app-root">
      {currentUser ? <ChatLayout /> : <AuthPage />}
    </div>
  );
}
