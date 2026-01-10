import { useEffect } from "react";

interface PrintProgressProps {
    state: Record<string, unknown>;
}
export function PrintProgress({ state }: PrintProgressProps) {
    useEffect(() => {
        console.log(state?.print_stats);
    },[state])

    return (
        <div>
            asd
        </div>
    )
}