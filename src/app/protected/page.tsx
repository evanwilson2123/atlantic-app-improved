import { auth } from '@clerk/nextjs/server'

export default async function ProtectedPage() {
  const { userId } = await auth()
  if (!userId) {
    return <div className="p-6">Not authenticated.</div>
  }
  return <div className="p-6">Hello, user {userId}</div>
}


