import { useSettings } from "@/core/settings/useSettings";
import { Tag } from "@/projects/entities/Project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagsInput } from "@/components/ui/tags-input";
import { IconFilter, IconSearch, IconX } from "@tabler/icons-react";
import useAxios from "axios-hooks";
import { useEffect, useState } from "react";

export type Filter = {
    name: string;
    tags: string[];
}

type ProjectFilterProps = {
    value: Filter;
    onChange: (f: Filter) => void;
};

export function ProjectFilter({ value, onChange }: ProjectFilterProps) {
    const { settings } = useSettings();
    const [filter, setFilter] = useState<Filter>(value)
    const [tags, setTags] = useState<string[]>([]);
    const [opened, setOpened] = useState(false);
    const [{ data, loading }] = useAxios<Tag[]>(
        `${settings.localBackend}/tags`
    );

    useEffect(() => {
        if (!data) return;
        setTags(data.map(t => t.value));
    }, [data])


    useEffect(() => {
        setFilter(value)
        if (value && (value.name != "" || value.tags.length > 0)) {
            setOpened(true)
        }
    }, [value])

    return (
        <div className="flex items-center gap-2">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setOpened(!opened)}
                disabled={loading}
            >
                {!opened ? <IconFilter className="h-5 w-5" /> : <IconX className="h-5 w-5" />}
            </Button>
            <div className={`flex items-center gap-2 transition-all ${opened ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 w-0 overflow-hidden"}`}>
                <Input 
                    placeholder="Name" 
                    value={filter.name} 
                    onChange={(e) => setFilter((f) => { return { ...f, name: e.target.value } })} 
                    className="w-[200px]"
                />
                <TagsInput
                    placeholder="Tags"
                    data={tags}
                    maxDropdownHeight={200}
                    value={filter.tags}
                    onChange={(v) => setFilter((f) => { return { ...f, tags: v } })}
                    splitChars={[',', ' ', '|']}
                    clearable
                    className="w-[200px]"
                />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onChange(filter)}
                    disabled={loading}
                >
                    <IconSearch className="h-5 w-5" />
                </Button>
            </div>
        </div>
    )
}
