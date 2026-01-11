import { Button } from "@/components/ui/button";
import { useWindowScroll } from "react-use";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Z_INDEX } from '../z-index';

export function ScrollToTop() {
    const { y } = useWindowScroll();
    const location = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [location.pathname]);

    return (
        <div className="fixed bottom-5 right-5" style={{ zIndex: Z_INDEX.SCROLL_TO_TOP }}>
            <Button
                size="icon"
                className={cn(
                    "transition-all duration-300",
                    y > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                )}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
                <ArrowUp className="h-4 w-4" />
            </Button>
        </div>
    );
}
