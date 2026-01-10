import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconPhoto, IconSettings } from "@tabler/icons-react";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export function ProjectsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<string>(location.pathname.split('/').slice(1)[1] ?? 'list');

    return (
        <>
            <Tabs value={activeTab} onValueChange={(v) => {
                setActiveTab(v);
                navigate(`/projects/${v}`);
            }}>
                <TabsList>
                    <TabsTrigger value="list">
                        <IconPhoto className="mr-2 h-3 w-3" />
                        Projects
                    </TabsTrigger>
                    <TabsTrigger value="import" className="ml-auto">
                        <IconSettings className="mr-2 h-3 w-3" />
                        Import
                    </TabsTrigger>
                    <TabsTrigger value="new">
                        <IconSettings className="mr-2 h-3 w-3" />
                        New
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            <Outlet />
        </>
    );
}
