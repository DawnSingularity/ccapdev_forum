
import dayjs from "dayjs";
import { api, type RouterOutputs } from "~/utils/api";
import Link from "next/link";
import relativeTime from "dayjs/plugin/relativeTime";
import { use, useState } from "react";
import { LoadingSpinner } from "./loading";
import { useUser } from "@clerk/nextjs";

dayjs.extend(relativeTime);



type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const PostView = (props: PostWithUser) => {
  const user = useUser();
  const {post, author} = props;
  const createdAt = dayjs(post.createdAt).fromNow();
  const updatedAt = dayjs(post.updatedAt).fromNow();
  const [updatetitle, setUpdatetitle] = useState(post.title);
  const [updateContent, setUpdateContent] = useState(post.content);

  const ctx = api.useContext(); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const {mutate: mutationUpdate, isLoading: isPosting} = api.posts.update.useMutation({
    onSuccess: () =>{
      console.log(post);
      setUpdatetitle(updatetitle);
      setUpdateContent(updateContent);
      setIsMenuOpen(!isMenuOpen);
      void ctx.posts.getAll.invalidate();
      
    }
  });
  const {mutate: mutationDelete, isLoading: isDeleting} = api.posts.delete.useMutation({
    onSuccess: () =>{
      setUpdatetitle("");
      setUpdateContent("");
      setIsMenuOpen(!isMenuOpen);
      void ctx.posts.getAll.invalidate();
    }
  });
  function handleUpdate(postId: string,updatedtitle: string, updatedContent: string){
    mutationUpdate({id: postId, title: updatedtitle, content: updatedContent})
  }
  function handleDelete(postId: string){
    mutationDelete({postId})
  }
  return(
    <>
      <div key={post.id} className="flex border-b border-slate-400 p-8 flex-col relative">
        <div className="flex inline-block">
          <Link href={`/${author.username ?? ""}`}>{author.username ?? ""} </Link>
          <span className="ml-5 font-thin">{`${createdAt}`}</span>
          {(createdAt !== updatedAt) && <span className="ml-2 font-thin">edited</span>}
        </div>

        <Link href={`/post/${post.id}`}>
          <div className="flex flex-col">
            {!isMenuOpen && (
              <>
                <span className="text-lg">{post.title} </span>
                <span className="font-thin">{post.content}</span>
              </>
            )}
            
          </div>
        </Link>
        {(user.user?.id === post.authorId) && (
          <div
          className="cursor-pointer flex flex-col items-center justify-center absolute top-0 right-0 m-2"
          onClick={toggleMenu}
        >
          <div className="h-0.5 w-6 bg-white rounded-full mb-1"></div>
          <div className="h-0.5  w-6 bg-white rounded-full mb-1"></div>
          <div className="h-0.5  w-6 bg-white rounded-full"></div>
        </div>
        )}
          

          {isMenuOpen && (
            <>
                <div className = " p-4 flex">
                
                <div className ="flex w-full gap-3">
                  <input 
                    placeholder="Title" 
                    className="bg-transparent grow outline-none"
                    type="text"
                    value={updatetitle}
                    onChange={(e) => setUpdatetitle(e.target.value)}
                    onKeyDown={(e)=>{
                      if(e.key === "Enter"){
                        e.preventDefault();
                        if(updatetitle !=="" && updateContent !==""){
                          handleUpdate(post.id, updatetitle, updateContent);
                        }
                      }
                    }}
                    disabled={isPosting}
                  />
                  <input 
                    placeholder="Content" 
                    className="bg-transparent grow outline-none" 
                    type="text"
                    name="content"
                    value={updateContent}
                    onChange={(e) => setUpdateContent(e.target.value)}
                    onKeyDown={(e)=>{
                      if(e.key === "Enter"){
                        e.preventDefault();
                        if(updatetitle !=="" && updateContent !==""){
                          handleUpdate(post.id, updatetitle, updateContent);
                        }
                      }
                    }}
                    disabled={isPosting}
                  />
                  
                  {isPosting && (
                    <div className="flex justify-center item-center">
                      <LoadingSpinner size={20}/>
                    </div>
                  )}
                </div>
              </div>
            
              {updatetitle !=="" && updateContent !=="" && !isPosting && (user.user?.id === post.authorId) && (
                <div className="absolute top-0 right-0 p-2 mt-5 shadow flex flex-col">
                  <button onClick={() => handleUpdate(post.id, updatetitle, updateContent)}>
                    Update
                  </button>
                  <button onClick={() => handleDelete(post.id)}>
                    Delete
                  </button>
                </div>
              
                

              )}
              
            
            </>
          )}
      </div>
        
      



      
      
      
    </>
  );
};
