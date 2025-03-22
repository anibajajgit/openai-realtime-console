
// Middleware to handle proper MIME types for JSX files
export function jsxMiddleware(req, res, next) {
  if (req.url && (req.url.endsWith('.jsx') || req.url.includes('.jsx'))) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  }
  next();
}
