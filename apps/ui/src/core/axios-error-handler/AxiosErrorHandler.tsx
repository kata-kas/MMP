import { toast } from "sonner";
import axios from "axios";
import { useEffect, useRef } from "react";
import { logger } from "@/lib/logger";

export function AxiosErrorHandler() {
    const initialized = useRef(false);
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        axios.interceptors.response.use(
            (response) => response,
            async (error: unknown) => {
                const axiosError = error as { code?: string; response?: { data?: { message?: string } }; message?: string };
                if (axiosError.code !== "ERR_CANCELED") {
                    logger.error(error)
                    const message = axiosError.response?.data?.message || axiosError.message || "An error occurred";
                    toast.error('Ops... An error occurred!', {
                        description: message,
                        duration: Infinity,
                    })
                }
                return Promise.reject(error);
            }
        );
    }, [])
    return (<></>)
}