import './styles/globals.css'

export const metadata = {
  title: 'Seller Rescue Hub',
  description: 'AI agent to rescue suspended Amazon seller accounts',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
