"use client";

import { useEffect } from 'react';

/**
 * MediaPipe Loader Component
 * Preloads MediaPipe Face Mesh with proper configuration
 * This helps avoid runtime errors by loading it early with correct settings
 */
export function MediaPipeLoader() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Prevent multiple loads
    if ((window as any).__mediapipe_loaded) return;
    (window as any).__mediapipe_loaded = true;

    const loadMediaPipe = async () => {
      try {
        console.log('🎬 Preloading MediaPipe Face Mesh...');
        
        // Check if already loaded
        if ((window as any).FaceMesh) {
          console.log('✅ MediaPipe already available');
          return;
        }

        // Load the script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js';
        script.crossOrigin = 'anonymous';
        script.async = true;

        const scriptPromise = new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          setTimeout(() => reject(new Error('MediaPipe load timeout')), 15000);
        });

        document.head.appendChild(script);
        await scriptPromise;

        console.log('✅ MediaPipe script loaded successfully');
      } catch (error) {
        console.warn('⚠️ MediaPipe preload failed (will fallback later):', error);
        // Don't throw - let the hook handle fallback
      }
    };

    loadMediaPipe();
  }, []);

  return null; // This component doesn't render anything
}
