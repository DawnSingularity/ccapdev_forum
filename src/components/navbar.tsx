import {SignInButton, UserButton, useUser } from "@clerk/nextjs";

import { useState } from "react";
import { useRouter } from "next/router";

const CreatePostWizard = () =>{
    const [search, setSearch] = useState('');
    const router = useRouter();

    const handleSearch = () => {
        router.push(`/search/${search}`);
    };
    
    return (
    <div className=" p-2 flex flex-row ">
        <div className="flex w-full gap-3">
          <input
            placeholder="search"
            className="bg-transparent border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (search !== '') {
                  handleSearch();
                }
              }
            }}
          />
          {search !== '' && (
            <button
              onClick={handleSearch}
              className="primaryButton hover:bg-green-300 text-white font-bold p-1 rounded"
            >
              Search
            </button>
          )}
        </div>
      </div>
    );
  };
export const NavBar = ()=>{
    const {isSignedIn, user } = useUser();
    return(
        <nav className="flex items-center justify-between p-4 border-b border-slate-400">
            <div className="flex items-center">
                <span className="text-white font-bold text-lg"></span>
                <CreatePostWizard/>
            </div>

            <div className="flex items-center">
                {!isSignedIn && (
                <div className="flex justify-center">

                    <SignInButton /></div>
                )}
                {!!isSignedIn && (
                    <div className="flex items-center">
                    <UserButton afterSignOutUrl="/"/>

                    <div className="ml-2">
                        {user?.username}
                    </div>
                </div>
                )}
            </div>
        </nav>
    );
}