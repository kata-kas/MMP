import type React from "react";
import { createContext, useContext } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import type { AgentSettings } from "@/settings/entities/AgentSettings";

type FormContextType = UseFormReturn<AgentSettings>;

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({
	children,
	form,
}: {
	children: React.ReactNode;
	form: FormContextType;
}) {
	return <FormContext.Provider value={form}>{children}</FormContext.Provider>;
}

export function useFormContext() {
	const context = useContext(FormContext);
	if (!context) {
		throw new Error("useFormContext must be used within FormProvider");
	}
	return context;
}

export { useForm };
