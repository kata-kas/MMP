import type { AxiosRequestConfig } from "axios";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { SettingsContext } from "@/core/settings/settingsContext";
import { useApiClient } from "@/lib/api-client";

interface UseApiQueryOptions<T> {
	url: string;
	config?: AxiosRequestConfig;
	enabled?: boolean;
	onSuccess?: (data: T) => void;
	onError?: (error: Error) => void;
}

export function useApiQuery<T = unknown>({
	url,
	config,
	enabled = true,
	onSuccess,
	onError,
}: UseApiQueryOptions<T>) {
	const api = useApiClient();
	const { ready } = useContext(SettingsContext);
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const [_refreshKey, setRefreshKey] = useState(0);

	const configRef = useRef(config);
	useEffect(() => {
		configRef.current = config;
	}, [config]);

	const memoizedOnSuccess = useCallback(
		(data: T) => {
			onSuccess?.(data);
		},
		[onSuccess],
	);

	const memoizedOnError = useCallback(
		(error: Error) => {
			onError?.(error);
		},
		[onError],
	);

	const shouldFetch = enabled && ready && !!url;

	useEffect(() => {
		if (!shouldFetch) {
			setLoading(false);
			setError(null);
			return;
		}

		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		setLoading(true);
		setError(null);

		api
			.get<T>(url, { ...configRef.current, signal: abortController.signal })
			.then((response) => {
				if (abortController.signal.aborted) return;
				setData(response.data);
				setLoading(false);
				memoizedOnSuccess(response.data);
			})
			.catch((err: unknown) => {
				if (abortController.signal.aborted) return;
				const error = err as Error & { name?: string };
				if (error.name !== "AbortError") {
					setError(error);
					setLoading(false);
					memoizedOnError(error);
				}
			});

		return () => {
			abortController.abort();
		};
	}, [api, url, shouldFetch, memoizedOnSuccess, memoizedOnError]);

	const refetch = useCallback(() => {
		setRefreshKey((prev) => prev + 1);
	}, []);

	return { data, loading, error, refetch };
}
