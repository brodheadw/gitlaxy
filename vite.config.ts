import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs/promises'
import path from 'path'

// File API plugin for reading and writing files
function fileApiPlugin(): Plugin {
  return {
    name: 'file-api',
    configureServer(server) {
      // Read file endpoint
      server.middlewares.use('/api/file/read', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const { filePath } = JSON.parse(body)

            if (!filePath) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'filePath is required' }))
              return
            }

            // Resolve path relative to project root
            // Paths like "/src/App.tsx" should map to "<project>/src/App.tsx"
            const projectRoot = process.cwd()
            const resolvedPath = filePath.startsWith('/')
              ? path.join(projectRoot, filePath)
              : path.resolve(filePath)

            if (!resolvedPath.startsWith(projectRoot)) {
              res.statusCode = 403
              res.end(JSON.stringify({ error: 'Access denied: Cannot read files outside project' }))
              return
            }

            const content = await fs.readFile(resolvedPath, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ content, path: resolvedPath }))
          } catch (err) {
            const error = err as NodeJS.ErrnoException
            res.statusCode = error.code === 'ENOENT' ? 404 : 500
            res.end(JSON.stringify({ error: error.message }))
          }
        })
      })

      // Write file endpoint
      server.middlewares.use('/api/file/write', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const { filePath, content } = JSON.parse(body)

            if (!filePath || content === undefined) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'filePath and content are required' }))
              return
            }

            // Resolve path relative to project root
            // Paths like "/src/App.tsx" should map to "<project>/src/App.tsx"
            const projectRoot = process.cwd()
            const resolvedPath = filePath.startsWith('/')
              ? path.join(projectRoot, filePath)
              : path.resolve(filePath)

            if (!resolvedPath.startsWith(projectRoot)) {
              res.statusCode = 403
              res.end(JSON.stringify({ error: 'Access denied: Cannot write files outside project' }))
              return
            }

            await fs.writeFile(resolvedPath, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, path: resolvedPath }))
          } catch (err) {
            const error = err as Error
            res.statusCode = 500
            res.end(JSON.stringify({ error: error.message }))
          }
        })
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fileApiPlugin()],
})
