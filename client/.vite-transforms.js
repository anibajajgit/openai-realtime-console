
// Custom Vite plugin for handling JSX files
export function jsxAsJsPlugin() {
  return {
    name: 'vite-plugin-jsx-as-js',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.endsWith('.jsx') || req.url.includes('.jsx'))) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          }
          next();
        });
      };
    },
    transform(code, id) {
      if (id.endsWith('.jsx')) {
        return {
          code,
          map: null
        };
      }
    }
  };
}
