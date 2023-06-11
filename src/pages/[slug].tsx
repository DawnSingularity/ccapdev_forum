import {SignInButton, UserButton, useUser } from "@clerk/nextjs";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

const Navbar = () => {
  const {isSignedIn, user } = useUser();

  return (
    <nav className="flex items-center justify-between p-4">
      <div className="flex items-center">
        <span className="text-white font-bold text-lg"></span>
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
};


const ProfilePage: NextPage<{username: string}> = ({username}) => {
  const {data} = api.profile.getUserByUsername.useQuery({
    username,
  });
  if(!data) return <div>404</div>
  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <main className="textColor">
        <Navbar/>
        <PageLayout>
            <div className="h-48">
            <Image
                src={data.profileImageUrl}
                alt={`${data.username ?? ""}'s profile picture`}
                width={168}
                height={168}
                className="rounded-full border-white border-2"
            />
            <div className="h-[32px]"></div>
            <div className="p-3 text-2xl font-bold">{data.username ?? ""}</div>
            </div>
            <div className="border-b w-full border-slate-500"></div>
        </PageLayout>

      </main>
    </>
  );
};

import { createServerSideHelpers } from '@trpc/react-query/server';
import { prisma } from '~/server/db';
import { appRouter } from "~/server/api/root";
import superjson from "superjson";
import Image from "next/image";
import { PageLayout } from "~/components/layout";

export const getStaticProps: GetStaticProps = async (context) =>{
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson,
  });

  const slug = context.params?.slug;
  if(typeof slug !== "string") throw new Error ("no slug");
  await ssg.profile.getUserByUsername.prefetch({username: slug})

  return {
    props:{
      trpcState: ssg.dehydrate(),
      username: slug,
    },
  };
};

export const getStaticPaths = () =>{
  return{paths: [], fallback: "blocking"};
};

export default ProfilePage;