import axios, { AxiosError } from 'axios';

export type ErrorSeverity = 'silent' | 'toast';

export interface ErrorConfig {
    severity: ErrorSeverity;
    title: string;
    description: string;
    duration: number;
    retryable: boolean;
}

function extractErrorMessage(error: AxiosError): string {
    if (!error.response) {
        return error.message || 'An error occurred';
    }

    const data = error.response.data;
    if (data && typeof data === 'object' && 'message' in data) {
        const message = (data as { message?: unknown }).message;
        return message ? String(message) : error.message || `Request failed with status ${error.response.status}`;
    }

    return error.message || `Request failed with status ${error.response.status}`;
}

export function getErrorConfig(error: AxiosError, isOffline: boolean): ErrorConfig {
    if (axios.isCancel(error)) {
        return {
            severity: 'silent',
            title: '',
            description: '',
            duration: 0,
            retryable: false,
        };
    }

    if (!error.response) {
        if (error.request) {
            return {
                severity: 'toast',
                title: isOffline ? 'Offline' : 'Network Error',
                description: isOffline 
                    ? 'You appear to be offline. Please check your connection.'
                    : error.message || 'Unable to reach the server. Please check your connection.',
                duration: 8000,
                retryable: true,
            };
        }
        return {
            severity: 'toast',
            title: 'Request Error',
            description: error.message || 'An error occurred while setting up the request.',
            duration: 5000,
            retryable: false,
        };
    }

    const status = error.response.status;
    const message = extractErrorMessage(error);

    switch (status) {
        case 401:
            return {
                severity: 'toast',
                title: 'Unauthorized',
                description: message || 'Your session has expired. Please refresh the page.',
                duration: 6000,
                retryable: false,
            };
        case 403:
            return {
                severity: 'toast',
                title: 'Forbidden',
                description: message || 'You don\'t have permission to perform this action.',
                duration: 5000,
                retryable: false,
            };
        case 404:
            // 404s are silent to avoid noise from expected failures (e.g., checking if resource exists,
            // navigating to deleted items). Components handle 404s with appropriate UI feedback.
            return {
                severity: 'silent',
                title: '',
                description: '',
                duration: 0,
                retryable: false,
            };
        case 429:
            return {
                severity: 'toast',
                title: 'Too Many Requests',
                description: message || 'Rate limit exceeded. Please try again later.',
                duration: 5000,
                retryable: true,
            };
        case 500:
            return {
                severity: 'toast',
                title: 'Server Error',
                description: message || 'An internal server error occurred. Please try again later.',
                duration: 6000,
                retryable: true,
            };
        case 502:
        case 503:
        case 504:
            return {
                severity: 'toast',
                title: 'Service Unavailable',
                description: message || 'The service is temporarily unavailable. Please try again later.',
                duration: 6000,
                retryable: true,
            };
        default:
            return {
                severity: 'toast',
                title: 'Request Failed',
                description: message || `An error occurred (${status}).`,
                duration: 5000,
                retryable: status >= 500,
            };
    }
}
