import Head from 'next/head'
import Link from 'next/link'
import { useEffect } from 'react'
import { clearLocalStorage } from '../utils/storage'

const Clear = () => {
  useEffect(() => {
    clearLocalStorage()
  }, [])
  return (
    <>
      <Head>
        <title>Clearing data...</title>
      </Head>
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg items-center justify-center border border-white rounded-md px-4 pt-3 pb-2">
          <div className="font-medium">Telefunken</div>
          <div className="font-mono mb-5">Your data has been cleared</div>
          <Link href="/" className="text-sm">
            Return to Home Page
          </Link>
        </div>
      </div>
    </>
  )
}

export default Clear
