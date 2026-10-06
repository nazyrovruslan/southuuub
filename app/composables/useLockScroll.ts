// Запрещает прокрутку страницы, пока locked = true (открытое меню, прелоадер)
export const useLockScroll = (locked: Ref<boolean>, restoreDelayMs = 0) => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const apply = (value: string) => {
        document.documentElement.style.overflowY = value;
        document.body.style.overflowY = value;
    };

    onMounted(() => {
        watch(locked, (isLocked) => {
            clearTimeout(timer);
            if (isLocked) {
                apply('hidden');
            } else if (restoreDelayMs) {
                timer = setTimeout(() => apply(''), restoreDelayMs);
            } else {
                apply('');
            }
        }, { immediate: true });
    });

    onBeforeUnmount(() => {
        clearTimeout(timer);
        apply('');
    });
};
