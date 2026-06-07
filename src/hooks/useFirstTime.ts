/**
 * STARDUST — First-Time Tracking Hook
 * Manages "seen" flags in localStorage for mode guides and feature spotlights.
 * Low-risk preference data — localStorage is appropriate.
 */
import { useState, useCallback } from 'react';

const STORAGE_PREFIX = 'stardust_firsttime_';

function getFlag(key: string): boolean {
    try {
        return localStorage.getItem(STORAGE_PREFIX + key) === 'true';
    } catch {
        return false;
    }
}

function setFlag(key: string): void {
    try {
        localStorage.setItem(STORAGE_PREFIX + key, 'true');
    } catch {
        // localStorage unavailable — proceed silently
    }
}

export function useFirstTime() {
    // Force re-render when flags change
    const [, setVersion] = useState(0);

    const hasSeenModeGuide = useCallback((mode: string): boolean => {
        return getFlag(`mode_guide_${mode}`);
    }, []);

    const markModeGuideSeen = useCallback((mode: string): void => {
        setFlag(`mode_guide_${mode}`);
        setVersion(v => v + 1);
    }, []);

    const hasSeenFeatureSpotlight = useCallback((feature: string): boolean => {
        return getFlag(`spotlight_${feature}`);
    }, []);

    const markFeatureSpotlightSeen = useCallback((feature: string): void => {
        setFlag(`spotlight_${feature}`);
        setVersion(v => v + 1);
    }, []);

    const resetAll = useCallback((): void => {
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
            keys.forEach(k => localStorage.removeItem(k));
            setVersion(v => v + 1);
        } catch {
            // Ignore
        }
    }, []);

    return {
        hasSeenModeGuide,
        markModeGuideSeen,
        hasSeenFeatureSpotlight,
        markFeatureSpotlightSeen,
        resetAll,
    };
}
