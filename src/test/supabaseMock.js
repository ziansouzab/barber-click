const CHAIN_METHODS = [
  'select',
  'insert',
  'update',
  'delete',
  'upsert',
  'eq',
  'neq',
  'in',
  'match',
  'order',
  'limit',
];

export function createQueryBuilder(result) {
  const builder = {};
  for (const method of CHAIN_METHODS) {
    builder[method] = jest.fn(() => builder);
  }
  builder.single = jest.fn(() => Promise.resolve(result));
  builder.maybeSingle = jest.fn(() => Promise.resolve(result));
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return builder;
}

export function createSupabaseMock(overrides = {}) {
  const tableResult = overrides.tableResult ?? { data: null, error: null };
  const rpcResult = overrides.rpcResult ?? { data: null, error: null };
  const authResult = overrides.authResult ?? { data: { user: null }, error: null };
  const sessionResult = overrides.sessionResult ?? { data: { session: null }, error: null };
  const uploadResult = overrides.uploadResult ?? { data: { path: 'uploads/file.jpg' }, error: null };

  return {
    from: jest.fn(() => createQueryBuilder(tableResult)),
    rpc: jest.fn(() => Promise.resolve(rpcResult)),
    auth: {
      signUp: jest.fn(() => Promise.resolve(authResult)),
      signInWithPassword: jest.fn(() => Promise.resolve(authResult)),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      getSession: jest.fn(() => Promise.resolve(sessionResult)),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve(uploadResult)),
        remove: jest.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: jest.fn((path) => ({
          data: { publicUrl: path ? `https://cdn.test/${path}` : null },
        })),
      })),
    },
  };
}
