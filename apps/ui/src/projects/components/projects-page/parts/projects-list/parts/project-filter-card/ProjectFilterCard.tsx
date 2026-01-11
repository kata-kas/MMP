import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagsInput } from '@/components/ui/tags-input';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo } from "react";
import { Tag } from "@/projects/entities/Project.ts";
import { useApiQuery } from '@/hooks/use-api-query';

export type Filter = {
    name: string;
    tags: string[];
}

type ProjectFilterCardProps = {
    onChange: (f: Filter) => void;
};

export function ProjectFilterCard({ onChange }: ProjectFilterCardProps) {
    const [filter, setFilter] = useState<Filter>({ name: '', tags: [] })
    const { data, loading } = useApiQuery<Tag[]>({
        url: '/tags',
    });

    const tags = useMemo(() => {
        return data?.map(t => t.value) ?? [];
    }, [data])

    const handleClear = () => {
        setFilter({ name: '', tags: [] })
        onChange({ name: '', tags: [] })
    }

    return (
        <Card className="relative">
            {loading && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                </div>
            )}
            <CardHeader>
                <CardTitle>Filter Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                        id="name"
                        value={filter.name} 
                        onChange={(e) => setFilter((f) => { return { ...f, name: e.target.value } })} 
                    />
                </div>
                <TagsInput
                    label="Tags"
                    data={tags}
                    maxDropdownHeight={200}
                    value={filter.tags}
                    onChange={(v) => setFilter((f) => { return { ...f, tags: v } })}
                    splitChars={[',', ' ', '|']}
                    clearable
                />
                <div className="flex justify-end gap-2">
                    <Button onClick={() => onChange(filter)}>Apply</Button>
                    <Button variant="outline" onClick={handleClear}>Clear</Button>
                </div>
            </CardContent>
        </Card>
    );
}
