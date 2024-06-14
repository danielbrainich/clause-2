import Link from 'next/link';
import { authConfig } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { SignOutButton } from './authButtons';


export default async function Navbar() {

    const session = await getServerSession(authConfig);

    const links = [
        {
            label: "Search",
            href: "/search",
            className: "block py-2 px-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-indigo-700 md:p-0 md:dark:hover:text-indigo-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent underline-animation",
        },
        {
            label: "My Stuff",
            href: "/saved",
            className: "block py-2 px-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-indigo-700 md:p-0 md:dark:hover:text-indigo-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent underline-animation",
        }
    ]


    return (
        <nav className="bg-slate-50">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <img src="/bill-logo.png" alt="Image of a cartoon bill" className="w-14" />
                <Link href="/" className="self-center font-caveat font-medium text-xl text-indigo-500 whitespace-nowrap">Capitol View</Link>
                <button data-collapse-toggle="navbar-default" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-default" aria-expanded="false">
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
                    </svg>
                </button>
                <div className="hidden w-full md:block md:w-auto" id="navbar-default">
                    <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md: dark:border-gray-700">
                        {links.map((link, index) => (
                            <li className="" key={index}>
                                <Link href={link.href} className={link.className}>{link.label}</Link>
                            </li>
                        ))
                        }
                    </ul>
                </div>
                {!session && (
                    <Link className="hover:text-indigo-700 underline-animation" href="/login">Login</Link>
                )}
                {session?.user?.image && (
                    <>
                        <SignOutButton />
                        <img className="round w-9 rounded-full" src={session?.user?.image} alt="Image of user" />
                    </>
                )}
            </div>
        </nav>
    );
}
