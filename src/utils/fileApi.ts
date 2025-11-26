// File API client for reading and writing files via the dev server

interface ReadFileResponse {
  content: string
  path: string
}

interface WriteFileResponse {
  success: boolean
  path: string
}

interface ErrorResponse {
  error: string
}

export async function readFile(filePath: string): Promise<string> {
  const response = await fetch('/api/file/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath }),
  })

  const data = await response.json() as ReadFileResponse | ErrorResponse

  if (!response.ok) {
    throw new Error((data as ErrorResponse).error || 'Failed to read file')
  }

  return (data as ReadFileResponse).content
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const response = await fetch('/api/file/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath, content }),
  })

  const data = await response.json() as WriteFileResponse | ErrorResponse

  if (!response.ok) {
    throw new Error((data as ErrorResponse).error || 'Failed to write file')
  }
}
