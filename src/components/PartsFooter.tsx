import { useState } from 'react'

export function PartsFooter() {
  const [count, setCount] = useState(0)
  return (
          <footer className="footer">
              <small>&copy; footer</small>
    </footer>
  )
}

