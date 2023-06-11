import {SignInButton, UserButton, useUser } from "@clerk/nextjs";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import Image from "next/image";
import { PageLayout } from "~/components/layout";
import { LoadingPage } from "~/components/loading";
import { PostView } from "~/components/postview";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";

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


const SinglePostPage: NextPage<{id: string}> = ({id}) => {
  const {data} = api.posts.getById.useQuery({
    id,
  });
  if(!data) return <div>404</div>
  return (
    <>
      <Head>
        <title>{`${data.post.content} - ${data.author.username}`}</title>
      </Head>
        <Navbar/>
        <PageLayout>
          <PostView {...data}/>
        </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) =>{
  const ssg = generateSSGHelper();

  const id = context.params?.id;
  if(typeof id !== "string") throw new Error ("no id");
  await ssg.posts.getById.prefetch({id});

  return {
    props:{
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

export const getStaticPaths = () =>{
  return{paths: [], fallback: "blocking"};
};

export default SinglePostPage;