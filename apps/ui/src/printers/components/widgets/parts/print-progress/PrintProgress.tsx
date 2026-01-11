import { useEffect } from "react";
import { logger } from "@/lib/logger";

interface PrintProgressProps {
	state: Record<string, unknown>;
}
export function PrintProgress({ state }: PrintProgressProps) {
	useEffect(() => {
		logger.log(state?.print_stats);
	}, [state]);

	return <div>asd</div>;
}
