import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsForm } from "./parts/settings-form/SettingsForm";
import { ServerOperations } from "./parts/server-operations/ServerOperations";
import { Experimental } from "./parts/experimental/Experimental";

export function SettingsPage() {
    return (
        <Tabs defaultValue="settings" orientation="vertical" className="flex gap-6">
            <TabsList className="flex flex-col h-fit w-[180px]">
                <TabsTrigger value="settings" className="w-full justify-start">Settings</TabsTrigger>
                <TabsTrigger value="operations" className="w-full justify-start">Operations</TabsTrigger>
                <TabsTrigger value="experimental" className="w-full justify-start">Experimental</TabsTrigger>
            </TabsList>
            <div className="flex-1 min-w-0">
                <TabsContent value="settings" className="mt-0">
                    <SettingsForm />
                </TabsContent>
                <TabsContent value="operations" className="mt-0">
                    <div className="container mx-auto max-w-4xl">
                        <ServerOperations />
                    </div>
                </TabsContent>
                <TabsContent value="experimental" className="mt-0">
                    <div className="container mx-auto max-w-4xl">
                        <Experimental />
                    </div>
                </TabsContent>
            </div>
        </Tabs>
    )
}
