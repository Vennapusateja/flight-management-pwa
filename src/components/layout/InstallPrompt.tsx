'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt from showing
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e);
      // Show our custom banner
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the browser's native install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    // Reset the deferred prompt variable
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-indigo-800 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md sm:left-auto sm:right-6">
      <div className="flex items-start gap-4">
        {/* App Logo Emblem */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/20">
          <svg className="h-6 w-6 transform -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-50">Install SourceAsia Air</h4>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Install our lightweight app on your home screen for quick offline access and real-time seat locking!
          </p>
          <div className="mt-3.5 flex items-center gap-2.5">
            <Button size="sm" onClick={handleInstallClick} className="shadow-md shadow-indigo-500/10">
              Install App
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-slate-400 hover:text-slate-300">
              Not Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
