import React, { useRef, useEffect } from 'react';
// import { showChooserAtScreen } from '../spherical-chooser/chooserCanvas'; // Assuming path
// import { screenToWorld } from '../../utils/coords'; // Assuming path
import { useStore } from '../../store/useStore'; // Using existing main store for camera/viewport
import { useSettingsStore } from '../../ui/settings/settingsStore';


export const CanvasInputHandler: React.FC = () => {
    const lastTapRef = useRef<number>(0);
    // const dragStartRef = useRef({ x: 0, y: 0, active: false });

    // Access viewport/camera from main store
    const viewport = useStore((state) => state.viewport);
    // Access settings
    // const mode = useSettingsStore(s => s.mode);
    // const showChooserPreview = useSettingsStore(s => s.showChooserPreview);

    useEffect(() => {
        const canvas = document.getElementById('root') || document.body; // Attaching to root or body to ensure capture
        if (!canvas) return;

        function onDoubleClickDesktop(ev: MouseEvent) {
            // desktop: double-click on background should open radial menu
            const target = ev.target as HTMLElement;
            if (!target) return;

            // If clicked on UI element (toolbar, note), ignore
            // Added .handle-base to ignore list
            if (
                target.closest('.stardust-toolbar') ||
                target.closest('.ui-interactive-area') ||
                target.closest('[data-note-id]') ||
                target.closest('.handle-base') ||
                target.closest('button') ||
                target.closest('input') ||
                target.closest('.editor-overlay-container') ||
                target.closest('.editor-overlay-wrapper') ||
                target.closest('.settings-panel') ||
                target.closest('.app-shell-container')
            ) return;

            // Check mode for special behaviors
            const currentViewMode = useSettingsStore.getState().viewMode;

            if (currentViewMode === 'void') {
                // In Void mode, double click creates a standard thought note (Earth)
                window.dispatchEvent(new CustomEvent('stardust:createStandardNote', {
                    detail: { x: ev.clientX, y: ev.clientY }
                }));
                return;
            }

            // Dispatch event that CanvasViewport listeners will pick up
            window.dispatchEvent(new CustomEvent('stardust:openRadialMenu', {
                detail: { x: ev.clientX, y: ev.clientY }
            }));
        }

        function onTouchEnd(ev: TouchEvent) {
            const now = Date.now();
            const last = lastTapRef.current;
            const delta = now - last;
            lastTapRef.current = now;

            const touch = ev.changedTouches[0];
            if (!touch) return;

            const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;

            if (delta < 300) {
                // double-tap
                // only when tapping empty canvas (not on notes)
                if (target && (
                    target.closest('[data-note-id]') ||
                    target.closest('.stardust-toolbar') ||
                    target.closest('.ui-interactive-area') ||
                    target.closest('.handle-base')
                )) {
                    return;
                }

                // Check if we should allow chooser
                const currentMode = useSettingsStore.getState().mode;

                if (currentMode === 'pro' || currentMode === 'ultra') {
                    window.dispatchEvent(new CustomEvent('stardust:openSphericalMenu', {
                        detail: { x: touch.clientX, y: touch.clientY }
                    }));
                }
            }
        }

        // Use capturing to ensure we get events before React if needed, or simply consistent bubbling
        window.addEventListener('dblclick', onDoubleClickDesktop);
        window.addEventListener('touchend', onTouchEnd);

        return () => {
            window.removeEventListener('dblclick', onDoubleClickDesktop);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [viewport]); // Re-attach if viewport relies on it (though mostly static)

    return null;
};
