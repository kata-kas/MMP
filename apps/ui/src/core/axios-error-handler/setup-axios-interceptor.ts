import axios, { type AxiosError, type AxiosResponse } from "axios";
import { logger } from "@/lib/logger";
import { getErrorConfig } from "./error-config";

let interceptorId: number | null = null;

function cleanup(): void {
	if (interceptorId !== null) {
		try {
			axios.interceptors.response.eject(interceptorId);
		} catch (error) {
			logger.warn("Failed to eject axios interceptor:", error);
		}
		interceptorId = null;
	}
}

export function setupAxiosErrorInterceptor(
	showErrorToast: (options: {
		title: string;
		description: string;
		duration: number;
	}) => void,
	isOffline: boolean,
): () => void {
	cleanup();

	interceptorId = axios.interceptors.response.use(
		(response: AxiosResponse) => response,
		(error: AxiosError) => {
			const config = getErrorConfig(error, isOffline);

			if (config.severity === "toast") {
				logger.error("API error:", error);
				showErrorToast({
					title: config.title,
					description: config.description,
					duration: config.duration,
				});
			}

			return Promise.reject(error);
		},
	);

	return cleanup;
}
