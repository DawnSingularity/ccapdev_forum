
import dayjs from "dayjs";
import { api, type RouterOutputs } from "~/utils/api";
import Link from "next/link";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { LoadingSpinner } from "./loading";

dayjs.extend(relativeTime);
type CommentWithUser = RouterOutputs["comments"]["getSingleCommentById"][number];
export const MainCommentView = (props: CommentWithUser) => {
  const user = useUser();
  const {comment, author} = props;
  const createdAt = dayjs(comment.createdAt).fromNow();
  const updatedAt = dayjs(comment.updatedAt).fromNow();
  const [updateContent, setUpdateContent] = useState(comment.content);
  const ctx = api.useContext(); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const {mutate: mutationUpdate, isLoading: isPosting} = api.comments.update.useMutation({
    onSuccess: () =>{
      setUpdateContent(updateContent);
      setIsMenuOpen(!isMenuOpen);
      void ctx.comments.getSingleCommentById.invalidate();
      
    }
  });
  const {mutate: mutationDelete, isLoading: isDeleting} = api.comments.delete.useMutation({
    onSuccess: () =>{
      setUpdateContent("");
      setIsMenuOpen(!isMenuOpen);
      void ctx.comments.getSingleCommentById.invalidate();
    }
  });
  {(isPosting || isDeleting) && (
    <div className="flex justify-center item-center">
      <LoadingSpinner size={20} />
    </div>
  )};
  function handleUpdate(commentId: string, updatedContent: string){
    mutationUpdate({id: commentId, content: updatedContent})
  };
  function handleDelete(commentId: string){
    mutationDelete({id: commentId})
  };
  return(
    <>
    <div key={comment.id} className ="flex border-b border-slate-400 p-8 gap-3 relative">
      <div className="flex flex-col">
        <Image 
          src={author.profileImageUrl} 
          alt={`${author.username ?? ""}'s profile picture`}
          className="rounded-full flex flex-col" 
          width={56}
          height={56}
        />
      </div>
      
      <div className="flex flex-col">
        <div className="flex gap-2">
          <span>{author.username}</span>
          <span className="font-thin">{ `${dayjs(comment.createdAt).fromNow()}` }</span>
          {(createdAt !== updatedAt) && <span className="ml-2 font-thin">edited</span>}
        </div>
        <Link href={`/comment/${comment.id}`}>
          <div className="flex flex-col w-96">
              {!isMenuOpen && (
                <>
                  <span className="font-thin">{comment.content}</span>
                </>
              )}
          </div>
        </Link>
        
      
      {(user.user?.id === comment.authorId) && (
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
              <div className = "flex border-b border-white-100 ">
                
                <div className ="flex w-96">
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
                        if( updateContent !==""){
                          handleUpdate(comment.id, updateContent);
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
            
              {updateContent !=="" && !isPosting && (user.user?.id === comment.authorId) && (
                <div className="absolute top-0 right-0 p-2 mt-5 shadow flex flex-col">
                  <button onClick={() => handleUpdate(comment.id, updateContent)}>
                    Update
                  </button>
                  <button onClick={() => handleDelete(comment.id)}>
                    Delete
                  </button>
                </div>
              
                

              )}
              
            
            </>
          )}
        </div>  
    </div>
    </>
  );
};