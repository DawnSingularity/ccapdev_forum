
import { SignOutButton } from "@clerk/clerk-react";
import { SignIn, SignInButton, SignedOut, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  const user = useUser();

  const { data: postData } = api.posts.getAll.useQuery();
  const { data: userData } = api.users.getAll.useQuery();
  const { data: commentData } = api.comments.getAll.useQuery();
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center h-screen">
        <div className=" w-full md:max-w-4xl border-x border-slate-500">
          <div className = "border-b border-slate-400 p-4 flex">
            {!user.isSignedIn && (
              <div className="flex justify-center">
                <SignInButton /></div>
              )}
            {!!user.isSignedIn && <SignOutButton />}
          </div>
          <div className ="flex flex-col">
            {commentData?.map((comment) => (
              <div key={comment.id} className ="border-b border-slate-400 p-8">
                {comment.content}
              </div>
            ))}
          </div>
          <div>
            {postData?.map((post) => (
              <div key={post.id} className ="border-b border-slate-400 p-8">
                {post.title}
                <br />
                {post.content}
              </div>
            ))}
          </div>
          <div>
            {userData?.map((user) => (
              <div key={user.id} className ="border-b border-slate-400 p-8">
                {user.id}
                <br />
                {user.createdAt.toString()}
              </div>
            ))}
          </div>
          
        </div>
      </main>
    </>
  );
};

export default Home;
