import { useEffect, useState } from "react";

/**
 * Mengembalikan nilai yang tertunda sampai `delay` ms setelah perubahan terakhir.
 */
export default function useDebouncedValue(value, delay = 450) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
