import { Icon3dRotate } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import React, { ReactElement } from "react";

type SelectBtnProps = {
    selected: boolean;
    onChange: (arg0: boolean) => void;
    icon?: ReactElement;
}

export function SelectBtn({ selected, onChange, icon }: SelectBtnProps) {
    const iconClone = React.cloneElement(icon || <Icon3dRotate />, {
        className: "h-5 w-5",
        stroke: 1.5
    })
    
    if (selected) {
        return (
            <div className="inline-flex items-center justify-center">
                <Checkbox checked={selected} onCheckedChange={(checked) => onChange(checked as boolean)} />
            </div>
        );
    }
    
    return (
        <Button variant="ghost" size="icon" onClick={() => onChange(true)}>
            {iconClone}
        </Button>
    );
}
