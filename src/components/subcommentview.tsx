
import dayjs from "dayjs";
import type { RouterOutputs } from "~/utils/api";
import Link from "next/link";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";

dayjs.extend(relativeTime);
type CommentWithUser = RouterOutputs["comments"]["getCommentByParentCommentId"][number];
export const SubCommentView = (props: CommentWithUser) => {
  const {comment, author} = props;
  const createdAt = dayjs(comment.createdAt).fromNow();
  const updatedAt = dayjs(comment.updatedAt).fromNow();
  return(
    <div key={comment.id} className ="flex border-b border-slate-400 p-8 gap-3 pl-16">
      <Image 
        src={author.profileImageUrl} 
        alt={`${author.username ?? ""}'s profile picture`}
        className="rounded-full" 
        width={56}
        height={56}
        />
      <div className="flex flex-col">
        <div className="flex gap-2">
          <span>{author.username}</span>
          <span className="font-thin">{ `${dayjs(comment.createdAt).fromNow()}` }</span>
          {(createdAt !== updatedAt) && <span className="ml-2 font-thin">edited</span>}
        </div>
        <Link href={`/comment/${comment.id}`}>
          <div className="flex flex-col">
              <span>{comment.content}</span>
          </div>
        </Link>
          
      </div>
    </div>
  );
};