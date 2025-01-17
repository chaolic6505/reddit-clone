import React from 'react'
import toast from 'react-hot-toast'
import TimeAgo from 'react-timeago'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery } from '@apollo/client'
import { SubmitHandler, useForm } from 'react-hook-form'

import Post from '../../components/Post'
import Loader from '../../components/Loader'
import Avatar from '../../components/Avatar'

import { ADD_COMMENT } from '../../graphql/mutations'
import { GET_POST_BY_POST_ID } from '../../graphql/queries'

type FormData = {
  comment: string
}

function PostPage() {
  const router = useRouter()
  const { data: session } = useSession()

  //refetch current post when adding a comment
  const { postId } = router.query
  const [addComment] = useMutation(ADD_COMMENT, {
    refetchQueries: [GET_POST_BY_POST_ID, 'getPostListByPostId'],
  })

  const { loading, data } = useQuery(GET_POST_BY_POST_ID, {
    variables: {
      post_id: postId,
    },
  })

  const post: Post = data?.getPostListByPostId

  const {
    setValue,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    //post comment here...
    const notification = toast.loading('Posting your comment...')

    await addComment({
      variables: {
        text: data.comment,
        post_id: router.query.postId,
        username: session?.user?.name,
      },
    })

    setValue('comment', '')

    toast.success('Comment Successfully Posted!', {
      //dismiss the other toast
      id: notification,
    })
  }

  if (!post || loading) return <Loader size={100} />

  return (
    <div className="mx-auto my-7 max-w-5xl border rounded-md border-gray-300 hover:border-gray-600 overflow-hidden shadow-sm">
      <Post key={post.id} post={post} />

      <div className="bg-white p-5 pl-16 -mt-2">
        <p className="text-sm">
          Comment as <span className="text-red-500">{session?.user?.name}</span>
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col space-y-2"
        >
          <textarea
            disabled={!session}
            {...register('comment')}
            className="h-24 rounded-md border border-gray-200 p-2 pl-4 outline-none disabled:bg-gray-50"
            placeholder={
              session ? 'What are your thoughts?' : 'Please sign in to comment'
            }
          />

          <button
            type="submit"
            disabled={!session}
            className="rounded-full bg-red-500 p-3 font-semibold text-white disabled:bg-gray-50"
          >
            Comment
          </button>
        </form>
      </div>

      <div className="rounded-b-md border border-t-0 border-l-0 border-r-0 border-gray-300 bg-white p-5 pl-16 pt-0">
        <hr className="py-1" />

        {post?.comments
          ?.map((comment: RedditComment) => {
            return {
              ...comment,
              created_at: new Date(comment?.created_at).getTime(),
            }
          })
          .sort((a, b) => b.created_at - a.created_at)
          ?.map((comment) => {
            return (
              <div
                className="relative flex items-center space-x-2 space-y-5"
                key={comment?.id}
              >
                <div className="z-50">
                  <Avatar seed={comment?.username} />
                </div>
                <div className="">
                  <p className="py-2 text-xs text-gray-400">
                    <span className="font-semibold text-gray-600">
                      {comment?.username}
                    </span>{' '}
                    · <TimeAgo date={comment?.created_at} />
                  </p>
                  <p>{comment?.text}</p>
                </div>
                <hr className="absolute top-10 left-3 z-0 h-16 border" />
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default PostPage
