/**
 * STARDUST — Feedback Trigger Hook
 * Watches note count. When first note is created (0 → 1),
 * starts a 30-second timer. After 30s, opens feedback modal
 * if status is 'pending' and editor is not open.
 */
import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getFeedbackStatus } from '../components/FeedbackModal';

export function useFeedbackTrigger(onOpen: () => void) {
    const noteCount = useStore((s) => s.notes.length);
    const prevCountRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const triggeredRef = useRef(false);

    useEffect(() => {
        // Detect transition from 0 to 1+ notes (first note created)
        if (prevCountRef.current === 0 && noteCount > 0 && !triggeredRef.current) {
            triggeredRef.current = true;

            timerRef.current = setTimeout(async () => {
                const status = await getFeedbackStatus();
                if (status === 'pending') {
                    // Check if editor is not open (no contenteditable focused)
                    const editorOpen = document.querySelector('[contenteditable="true"]:focus');
                    if (!editorOpen) {
                        onOpen();
                    }
                }
            }, 30_000);
        }
        prevCountRef.current = noteCount;

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [noteCount, onOpen]);
}
