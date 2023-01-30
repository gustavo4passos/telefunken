import Head from 'next/head'
import Image from 'next/image'
import { useAppSelector } from '../store/hooks'
import { selectTheme, Theme } from '../store/slices/appSettingsSlice'
import LanguageSelector from '../components/LanguageSelector'
import ThemeToggleButton from '../components/ThemeToggleButton'
import Link from 'next/link'

export default function Home() {
  const currentTheme = useAppSelector(selectTheme)

  return (
    <>
      <Head>
        <title>telefunken</title>
      </Head>
      <main className={`${currentTheme == Theme.Dark && 'dark'}`}>
        <div className="bg-white flex flex-col min-h-screen items-center justify-center py-12 px-4 dark:bg-slate-800">
          <div className="absolute top-10">
            <ThemeToggleButton />
          </div>
          <div className="w-full max-w-md space-y-6">
            <div className="mb-10">
              <Image
                width={12}
                height={12}
                className="animate-bounce mx-auto h-12 w-auto"
                src="/logo.svg"
                alt="Telefunken Logo"
                draggable={false}
              />
              <h2 className="dark:text-white mt-3 text-center text-6xl font-bold tracking-tight text-gray-900">
                Telefunken
              </h2>
              <p className="dark:text-slate-400 mt-2 text-xl text-center text-gray-600">
                To play, create a new game or join an existing one
              </p>
            </div>
            <div className="shadow-lg px-12 py-4 space-y-2">
              <form className="space-y-6" action="#" method="POST">
                <div className="-space-y-px rounded-md shadow-sm">
                  <div className="space-y-2">
                    <div className="text-center text-lg text-gray-900 dark:text-slate-400">
                      Join a Game
                    </div>
                    <input
                      id="game-id"
                      name="game-id"
                      type="text"
                      className="bg-inherit dark:text-slate-200 text-center w-full rounded-none appearance-none rounded-t-md border px-3 py-2 border-gray-300 dark:border-gray-500 text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Game ID"
                    ></input>
                  </div>
                </div>
              </form>
              <div className="mt-2 text-center text-lg text-gray-600 dark:text-slate-400">
                Or
              </div>
              <p className="text-center text-xl text-gray-600 dark:text-slate-400">
                <Link
                  href="/game"
                  className="font-medium text-indigo-400 hover:text-indigo-300"
                >
                  Create a New Game
                </Link>
              </p>
            </div>
            <div className="flex relative justify-center">
              <div className="absolute top-3 w-20">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
