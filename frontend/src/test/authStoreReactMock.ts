// Keep the real store/actions, but subscribe with the test renderer's React copy.
// Zustand's external CommonJS shim otherwise resolves the mobile workspace's React.
vi.mock('@/stores/auth.store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/auth.store')>();
  const { useSyncExternalStore } = await import('react');
  const store = actual.useAuthStore;
  const useAuthStore = Object.assign(
    (selector?: (state: ReturnType<typeof store.getState>) => unknown) => {
      const state = useSyncExternalStore(store.subscribe, store.getState, store.getInitialState);
      return selector ? selector(state) : state;
    },
    store,
  );
  return { useAuthStore };
});
