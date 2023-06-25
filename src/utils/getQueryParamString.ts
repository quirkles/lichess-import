export function getQueryParamString(paramObject: Record<string, string | number | boolean> = {}): string {
    const str = Object.entries(paramObject).reduce(
        (string, [key, val]) => `${string}&${key}=${val}`, ''
    )
    return str.length ? `?${str}` : str
}
