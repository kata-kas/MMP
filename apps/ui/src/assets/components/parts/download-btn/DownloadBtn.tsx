import { Button } from "@/components/ui/button";
import { IconDownload } from "@tabler/icons-react";

type DownloadBtnProps = {
    downloadLink: string;
}

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
