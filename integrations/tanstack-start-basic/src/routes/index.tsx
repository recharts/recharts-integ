import { createFileRoute } from '@tanstack/react-router'
import App from "~/components/App";
export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="p-2">
      <h3>Welcome Home!!!</h3>
        <App />
    </div>
  )
}
