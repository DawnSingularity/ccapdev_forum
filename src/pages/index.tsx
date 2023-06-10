import {SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import Image from "next/image";
import { LoadingPage } from "~/components/loading";
import { useState } from "react";


dayjs.extend(relativeTime);

const Navbar = () => {
  const {isSignedIn, user } = useUser();

  return (
    <nav className="flex items-center justify-between p-4">
      <div className="flex items-center">
        <img src="/logo.png" alt="Logo" className="w-8 h-8 mr-4" />
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
                {user.username}
              </div>
          </div>
        )}
      </div>
    </nav>
  );
};


const CreatePostWizard = () =>{
  const {user} = useUser();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const ctx = api.useContext();

  const {mutate, isLoading: isPosting} = api.posts.create.useMutation({
    onSuccess: ()=>{
      setTitle("");
      setContent("");
      ctx.posts.getAll.invalidate();
    }
  });

  if(!user) return null;
  return (
    <div className = "border-b border-slate-400 p-8 flex">
      <div className ="flex w-full gap-3">
        <input 
          placeholder="Title" 
          className="bg-transparent grow outline-none"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPosting}
        />
        <input 
          placeholder="Content" 
          className="bg-transparent grow outline-none" 
          type="text"
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPosting}
        />
        <button onClick={() => mutate({title, content})}>Post</button>
      </div>
    </div>
  );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
const PostView = (props: PostWithUser) => {
  const {post, author} = props;
  return(
    <div key={post.id} className ="flex border-b border-slate-400 p-8  ">
      {author.username}
      <br />
      {post.title} 
      <br />
      {post.content}
      <br />
      <span className="font-thin">{ `${dayjs(post.createdAt).fromNow()}` }</span>
    </div>
  );
};


type CommentWithUser = RouterOutputs["comments"]["getAll"][number];
const CommentView = (props: CommentWithUser) => {
  const {comment, author} = props;
  return(
    <div key={comment.id} className ="flex border-b border-slate-400 p-8 gap-3">
      <Image 
        src={author.profileImageUrl} 
        alt={`${author.username}'s profile picture`}
        className="rounded-full" 
        width={56}
        height={56}
        />
      <div className="flex flex-col">
        <div className="flex gap-2">
          <span>{author.username}</span>
          <span className="font-thin">{ `${dayjs(comment.createdAt).fromNow()}` }</span>
        </div>
          <span>{comment.content}</span>
      </div>
    </div>
  );
};


const PostFeed = () =>{
  const { data: postData, isLoading: postsLoading } = api.posts.getAll.useQuery();
  if(postsLoading) return <LoadingPage/>;
  if(!postData) return <div>Something went wrong</div>;
  return (
    <div className ="flex flex-col">
      {postData?.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id}/>
      ))}
    </div>
  );
};

const UserFeed = () =>{
  const { data: userData, isLoading: UsersLoading } = api.users.getAll.useQuery();
  if(UsersLoading) return <LoadingPage/>;
  if(!userData) return <div>Something went wrong</div>;
  return (
    <div className ="flex flex-col">
      {userData?.map((user) => (
        <div key={user.id} className ="border-b border-slate-400 p-8">
          {user.id}
          <br />
          {user.createdAt.toString()}
        </div>
      ))}
    </div>
  );
};

const CommentFeed = () => {
  const { data: commentData, isLoading: CommentsLoading } = api.comments.getAll.useQuery();

  if(CommentsLoading) return <LoadingPage/>;
  if(!commentData) return <div>Something went wrong</div>;

  return (
    <div className ="flex flex-col">
      {commentData?.map((fullPost) => (
        <CommentView {...fullPost} key={fullPost.comment.id}/>
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isLoaded: userLoaded } = useUser();

  //fetch all necessary data asap
  api.posts.getAll.useQuery();
  api.users.getAll.useQuery();
  api.comments.getAll.useQuery();
  
  if(!userLoaded) return < div/>;
  
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="textColor">
        <Navbar/>
        <div className="flex justify-center h-screen">
          <div className=" w-full md:max-w-4xl border border-slate-500">
              <CreatePostWizard />
            <CommentFeed/>
            <PostFeed/>
            <UserFeed/>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
