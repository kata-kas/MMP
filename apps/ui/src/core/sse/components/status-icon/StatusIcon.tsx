import { useContext } from "react"
import { SSEContext } from "../../SSEContext"
import { Button } from "@/components/ui/button"
import { Loader2, Smile, Skull } from "lucide-react"
import { IconMoodSmileBeam, IconSkull } from "@tabler/icons-react"

export function StatusIcon({ className, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
    const { connected, loading, error } = useContext(SSEContext)

    return (
        <Button variant="ghost" size="icon" className={className} {...props}>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-white" />}
            {connected && <IconMoodSmileBeam stroke={1.5} className="text-white" />}
            {error && <IconSkull stroke={1.5} className="text-white" />}
        </Button>
    )
}
