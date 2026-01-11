import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';
import { toast as sonnerToast } from 'sonner';

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
    },
}));

function TestComponent() {
    const { showErrorToast } = useToast();
    
    return (
        <button onClick={() => showErrorToast({ title: 'Test', description: 'Test error', duration: 5000 })}>
            Show Toast
        </button>
    );
}

describe('ToastProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should provide showErrorToast function via context', () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const button = screen.getByText('Show Toast');
        expect(button).toBeInTheDocument();
    });

    it('should call sonnerToast.error when showErrorToast is called', () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const button = screen.getByText('Show Toast');
        act(() => {
            button.click();
        });

        expect(sonnerToast.error).toHaveBeenCalledWith('Test', expect.objectContaining({
            description: 'Test error',
            duration: 5000,
            onDismiss: expect.any(Function),
        }));
    });

    it('should cleanup interval on unmount', () => {
        const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
        
        const { unmount } = render(
            <ToastProvider>
                <div>Test</div>
            </ToastProvider>
        );

        act(() => {
            vi.advanceTimersByTime(100);
        });

        unmount();

        expect(clearIntervalSpy).toHaveBeenCalled();
        clearIntervalSpy.mockRestore();
    });

    it('should throw error when useToast is used outside provider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        expect(() => {
            render(<TestComponent />);
        }).toThrow('useToast must be used within ToastProvider');

        consoleError.mockRestore();
    });

    it('should deduplicate toasts within window', () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const button = screen.getByText('Show Toast');
        
        act(() => {
            button.click();
            button.click();
        });

        expect(sonnerToast.error).toHaveBeenCalledTimes(1);
    });

    it('should allow duplicate toasts after deduplication window', () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const button = screen.getByText('Show Toast');
        
        act(() => {
            button.click();
        });

        act(() => {
            vi.advanceTimersByTime(2100);
            button.click();
        });

        expect(sonnerToast.error).toHaveBeenCalledTimes(2);
    });
});
