import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DashboardItem, WidgetType } from "@/dashboard/entities/WidgetType";
import { dashboardContext } from "@/dashboard/provider/DashboardContext";
import React, { useCallback, useContext, useState } from "react";
import { IconLock, IconLockOpen, IconPlus, IconSettings, IconSettingsOff } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
    addItem: (bla: DashboardItem) => void;
    locked: boolean;
    toggleLock: () => void;
    edit: boolean;
    toggleEdit: () => void;
}

export function Header({ addItem, locked, toggleLock, edit, toggleEdit }: HeaderProps) {
    const { widgetTypes } = useContext(dashboardContext)
    const [opened, setOpened] = useState(false);
    const [config, setConfig] = useState<Record<string, unknown>>({});
    const [selectedType, setSelectedType] = useState<WidgetType | undefined>();

    const addWidget = useCallback(() => {
        if (!selectedType) return;
        const id = `${selectedType.type}-${Math.random().toString(36).substr(2, 9)}`
        addItem(
            {
                widget: {
                    id,
                    type: selectedType.type,
                    config,
                    layout: { i: id, x: 0, y: 0, ...selectedType.layout }
                },
                layout: { i: id, x: 0, y: 0, ...selectedType.layout }
            })
        reset()
        setOpened(false)
    }, [config, selectedType, addItem])

    const reset = () => {
        setSelectedType(undefined)
        setConfig({} as Record<string, unknown>)
    }

    return (<>
        <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLock}>
                {locked ? <IconLock className="h-4 w-4" /> : <IconLockOpen className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleEdit}>
                {edit ? <IconSettingsOff className="h-4 w-4" /> : <IconSettings className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setOpened(true)}>
                <IconPlus className="h-4 w-4" />
            </Button>
        </div>
        <Sheet open={opened} onOpenChange={setOpened}>
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>Add Widget</SheetTitle>
                    <SheetDescription>
                        Select a widget type to add to your dashboard
                    </SheetDescription>
                </SheetHeader>
                {!selectedType && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        {Array.from(widgetTypes.values()).map(wt => (
                            <button
                                key={wt.type}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground"
                                )}
                                onClick={() => setSelectedType(wt)}
                            >
                                {React.cloneElement(wt.icon, { className: "h-8 w-8 text-primary" })}
                                <p className="text-xs">{wt.name}</p>
                            </button>
                        ))}
                    </div>
                )}

                {selectedType && (
                    <div className="mt-4 space-y-4">
                        {React.cloneElement(selectedType.configElement, { config: config, onChange: setConfig })}
                        <div className="flex gap-2">
                            <Button onClick={addWidget}>Add</Button>
                            <Button variant="outline" onClick={reset}>Cancel</Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    </>
    )
}
