import { useCallback, useMemo, useState } from 'react'

export type MapOrEntries<K, V> = Map<K, V> | [K, V][]

// Public interface
export interface Actions<K, V> {
  set: (key: K, value: V) => void
  setAll: (entries: MapOrEntries<K, V>) => void
  remove: (key: K) => void
  reset: Map<K, V>['clear']
}
///https://usehooks-ts.com/react-hook/use-map
// We hide some setters from the returned map to disable autocompletion
type Return<K, V> = [Omit<Map<K, V>, 'set' | 'clear' | 'delete'>, Actions<K, V>]

export function useMap<K, V>(
  initialState: MapOrEntries<K, V> = new Map(),
): Return<K, V> {
  const [map, setMap] = useState(new Map(initialState))

  const set = useCallback((key: K, value: V) => {
    setMap(prev => {
      const copy = new Map(prev)
      copy.set(key, value)
      return copy
    })
  }, [])

  const setAll = useCallback((entries: MapOrEntries<K, V>) => {
    setMap(() => new Map(entries))
  }, [])

  const remove = useCallback((key: K) => {
    setMap(prev => {
      const copy = new Map(prev)
      copy.delete(key)
      return copy
    })
  }, [])

  const reset = useCallback(() => {
    setMap(() => new Map())
  }, [])

  const actions: Actions<K, V> = useMemo(() => ({
    set,
    setAll,
    remove,
    reset,
  }), [set, setAll, remove, reset])

  return [map, actions]
}