import { toast } from "sonner";
import axios from "axios";
import { useEffect, useRef } from "react";

export function AxiosErrorHandler() {
    const initialized = useRef(false);
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.code != "ERR_CANCELED") {
                    console.log(error)
                    let message = error.response?.data?.message || error.message;
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