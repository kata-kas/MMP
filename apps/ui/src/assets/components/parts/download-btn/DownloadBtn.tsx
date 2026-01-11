import { IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

type DownloadBtnProps = {
	downloadLink: string;
};

export function DownloadBtn({ downloadLink }: DownloadBtnProps) {
	return (
		<Button variant="ghost" size="icon" asChild>
			<a href={downloadLink}>
				<IconDownload
					className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
					stroke={1.5}
				/>
			</a>
		</Button>
	);
}
