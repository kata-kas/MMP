import React, { ReactElement } from "react"
import { cn } from "@/lib/utils";

interface TempProps {
    icon: ReactElement
    current: number
    target?: number
}

export function Temp({ icon, current, target }: TempProps) {
    return (
        <div className="flex flex-col gap-0">
            <div className="flex items-center justify-center">{React.cloneElement(icon, {})}</div>
            <p className="text-sm">{(Math.round(current * 100) / 100).toFixed(1)}°c</p>
            {target !== undefined && (
                <p className="text-sm">{(Math.round(target * 100) / 100).toFixed(1)}°c</p>
            )}
        </div>
    )
}
