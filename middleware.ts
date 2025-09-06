import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: [
    '/',
    '/api/(.*)',
  ],
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}


