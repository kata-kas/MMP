import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { OfflineProvider, useOffline } from './OfflineContext';

function TestComponent() {
    const { isOffline } = useOffline();
    return <div>{isOffline ? 'Offline' : 'Online'}</div>;
}

describe('OfflineProvider', () => {
    let originalOnLine: boolean;

    beforeEach(() => {
        originalOnLine = navigator.onLine;
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true,
        });
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: originalOnLine,
        });
    });

    it('should provide isOffline state via context', () => {
        render(
            <OfflineProvider>
                <TestComponent />
            </OfflineProvider>
        );

        expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should initialize with current navigator.onLine state', () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: false,
        });

        render(
            <OfflineProvider>
                <TestComponent />
            </OfflineProvider>
        );

        expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('should update state when online event fires', async () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: false,
        });

        render(
            <OfflineProvider>
                <TestComponent />
            </OfflineProvider>
        );

        expect(screen.getByText('Offline')).toBeInTheDocument();

        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true,
        });

        act(() => {
            window.dispatchEvent(new Event('online'));
        });

        await waitFor(() => {
            expect(screen.getByText('Online')).toBeInTheDocument();
        });
    });

    it('should update state when offline event fires', async () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true,
        });

        render(
            <OfflineProvider>
                <TestComponent />
            </OfflineProvider>
        );

        expect(screen.getByText('Online')).toBeInTheDocument();

        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: false,
        });

        act(() => {
            window.dispatchEvent(new Event('offline'));
        });

        await waitFor(() => {
            expect(screen.getByText('Offline')).toBeInTheDocument();
        });
    });

    it('should cleanup event listeners on unmount', () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
        
        const { unmount } = render(
            <OfflineProvider>
                <TestComponent />
            </OfflineProvider>
        );

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should throw error when useOffline is used outside provider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        expect(() => {
            render(<TestComponent />);
        }).toThrow('useOffline must be used within OfflineProvider');

        consoleError.mockRestore();
    });
});
