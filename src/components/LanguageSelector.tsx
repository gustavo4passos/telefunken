import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import {
  Language,
  changeLanguage,
  selectLanguage,
} from '../store/slices/appSettingsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { ChevronUpDownIcon } from '@heroicons/react/20/solid'
const languages: Language[] = [
  Language.English,
  Language.Portuguese,
  Language.Spanish,
]

const LanguageSelector = () => {
  const selectedLanguage = useAppSelector(selectLanguage)
  const dispatch = useAppDispatch()

  return (
    <Listbox
      value={selectedLanguage}
      onChange={(l: Language) => dispatch(changeLanguage(l))}
    >
      <Listbox.Button className="dark:bg-slate-700 dark:text-slate-200 relative w-full cursor-default rounded-lg py-1 shadow-md focus:outline-none focus-visible:border-indigo-500">
        <span className="block truncate">{selectedLanguage as string}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-1">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
        </span>
      </Listbox.Button>
      <Transition
        as={Fragment}
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 rotate-[-120deg]"
        leaveTo="opacity-0 rotate-0"
      >
        <Listbox.Options className="">
          {languages.map((l, idx) => (
            <Listbox.Option
              key={idx}
              value={l}
              className={({ active }) =>
                `cursor-default select-none py-2 pl-8 pr-4 ${
                  active
                    ? 'bg-indigo-100 text-amber-900 dark:bg-slate-600 dark:text-slate-100'
                    : 'text-gray-800 dark:text-slate-300'
                }`
              }
            >
              {({ selected }) => (
                <>
                  <span
                    className={`block truncate ${
                      selected ? 'font-medium' : 'font-normal'
                    }`}
                  >
                    {l as string}
                  </span>
                </>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </Transition>
    </Listbox>
  )
}

export default LanguageSelector
