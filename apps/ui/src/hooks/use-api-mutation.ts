import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { useCallback, useState } from "react";
import { useApiClient } from "@/lib/api-client";

interface UseApiMutationOptions<TData, TVariables> {
	url: string | ((variables: TVariables) => string);
	method?: "get" | "post" | "put" | "patch" | "delete";
	onSuccess?: (data: TData) => void;
	onError?: (error: Error) => void;
}

export function useApiMutation<TData = unknown, TVariables = unknown>({
	url,
	method = "post",
	onSuccess,
	onError,
}: UseApiMutationOptions<TData, TVariables>) {
	const api = useApiClient();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const mutate = useCallback(
		(variables: TVariables, config?: AxiosRequestConfig) => {
			setLoading(true);
			setError(null);

			const requestUrl = typeof url === "function" ? url(variables) : url;

			let requestPromise: Promise<AxiosResponse<TData>>;

			switch (method) {
				case "get":
					requestPromise = api.get<TData>(requestUrl, config);
					break;
				case "delete":
					requestPromise = api.delete<TData>(requestUrl, config);
					break;
				case "put":
					requestPromise = api.put<TData>(requestUrl, variables, config);
					break;
				case "patch":
					requestPromise = api.patch<TData>(requestUrl, variables, config);
					break;
				default:
					requestPromise = api.post<TData>(requestUrl, variables, config);
					break;
			}

			return requestPromise
				.then((response) => {
					setLoading(false);
					onSuccess?.(response.data);
					return response.data;
				})
				.catch((err) => {
					const error = err as Error;
					setError(error);
					setLoading(false);
					onError?.(error);
					throw error;
				});
		},
		[api, url, method, onSuccess, onError],
	);

	return { mutate, loading, error };
}
