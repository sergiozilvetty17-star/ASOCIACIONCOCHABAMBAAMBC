const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function send(res, statusCode, content, contentType) {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  });
  res.end(content);
}

function getFilePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const normalizedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const safePath = path.normalize(normalizedPath).replace(/^([/\\])+/, '');
  return path.join(rootDir, safePath);
}

const server = http.createServer((req, res) => {
  const filePath = getFilePath(req.url || '/');

  if (!filePath.startsWith(rootDir)) {
    send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        send(res, 404, 'Not found', 'text/plain; charset=utf-8');
        return;
      }
      send(res, 500, 'Server error', 'text/plain; charset=utf-8');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    send(res, 200, data, contentType);
  });
});

server.listen(port, () => {
  console.log(`Servidor listo en http://localhost:${port}`);
});
