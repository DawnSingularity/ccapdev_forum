
import dayjs from "dayjs";
import type { RouterOutputs } from "~/utils/api";
import Link from "next/link";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const PostView = (props: PostWithUser) => {
  const {post, author} = props;
  return(
    <div key={post.id} className ="flex border-b border-slate-400 p-8 flex-col">
      <div className="flex inline-block">
        <Link href={`/${author.username ?? ""}`} >{author.username ?? ""} </Link>
        <span className="ml-5 font-thin">{ `${dayjs(post.createdAt).fromNow()}` }</span>
      </div>
      
      <Link href={`/post/${post.id}`} >
        <div className="flex flex-col">
          <span className="text-lg">{post.title} </span>
          <span className="font-thin">{post.content}</span>
        </div>
      </Link>

      
    </div>
  );
};
