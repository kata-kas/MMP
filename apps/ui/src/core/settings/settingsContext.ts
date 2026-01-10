import React from 'react';

export interface Settings {
    localBackend: string,
    agent?: Record<string, unknown>
    experimental: ExperimentalFeatures
}
export interface ExperimentalFeatures {
    dashboard: boolean
}
interface SettingsProviderType {
    settings: Settings,
    setExperimental: (mutator: (prev: ExperimentalFeatures) => ExperimentalFeatures) => void,
}
export const SettingsContext = React.createContext<SettingsProviderType>({} as SettingsProviderType);