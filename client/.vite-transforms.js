
// Custom transform to handle JSX files
export function enforceJSXAsJS() {
  return {
    name: 'enforce-jsx-as-js',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url.endsWith('.jsx') || req.url.includes('.jsx'))) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
        next();
      });
    }
  };
}
