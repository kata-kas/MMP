import { Skeleton } from "@/components/ui/skeleton";

export function AssetCardSkeleton() {
    return (
        <div className="m-2 flex h-56 w-56 flex-col items-center justify-end shadow-md rounded-lg overflow-hidden relative bg-card">
            <Skeleton className="h-full w-full absolute inset-0" />
            <div className="flex w-full flex-col p-3 z-10 bg-background/80 backdrop-blur-sm">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}
