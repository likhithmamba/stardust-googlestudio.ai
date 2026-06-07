import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../ui/settings/settingsStore';

export const SemanticZoomController = () => {
    const viewport = useStore((state) => state.viewport);
    const setViewport = useStore((state) => state.setViewport);
    const viewMode = useSettingsStore((state) => state.viewMode);

    // Enforce zoom bounds [10%–400%]
    useEffect(() => {
        if (viewport.zoom < 0.1 || viewport.zoom > 4.0) {
            const clampedZoom = Math.max(0.1, Math.min(4.0, viewport.zoom));
            setViewport({ ...viewport, zoom: clampedZoom });
        }
    }, [viewport.zoom, viewport, setViewport]);

    // Reset zoom to 100% (1.0) on mode switch
    useEffect(() => {
        setViewport({ ...viewport, zoom: 1.0 });
    }, [viewMode]);

    return null;
};
