import toast from 'react-hot-toast';
import { Loader } from '~/components/Loader';
import { client } from '~/lib/client/client';
import { TweetsScheme } from '~/lib/scheme/tweets';
import { AddTweetForm } from '../../src/components/tweets/AddTweetForm';
import { LikeButton } from '../../src/components/tweets/LikeButton';
import { RepliesButton } from '../../src/components/tweets/RepliesButton';
import { Tweet } from '../../src/components/tweets/Tweet';
import TwitterLayout from '../../src/components/TwitterLayout';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Error } from '~/components/Error';

const notifyFailed = () => toast.error("Couldn't fetch tweet...");

const getTweets = async (signal?: AbortSignal, page = 0) =>
  client(`/api/tweets?page=${page}`, { signal, zodSchema: TweetsScheme });

export default function FetchAllTweets() {
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['tweets'],
    queryFn: ({ signal, pageParam }) => getTweets(signal, pageParam),
    onError: () => notifyFailed(),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  if (isLoading) return <Loader />;

  if (isError) return <Error error="Impossible to fetch..." reset={refetch} />;

  const tweets = data.pages.flatMap((page) => page.tweets);
  const nextPageStatus = hasNextPage ? 'Load more tweets...' : 'End of tweets';

  return (
    <TwitterLayout>
      <AddTweet />
      {tweets.map((tweet) => (
        <Tweet key={tweet.id} tweet={tweet}>
          <RepliesButton count={tweet._count.replies} />
          <LikeButton count={tweet._count.likes} liked={tweet.liked} />
        </Tweet>
      ))}
      <button onClick={() => fetchNextPage()} className="block py-4">
        {isFetchingNextPage ? 'Loading more...' : nextPageStatus}
      </button>
    </TwitterLayout>
  );
}

type AddTweetProps = { tweetId?: string };
const tweetKeys = {
  all: ['tweets'],
  getById: (id: string) => ['tweet', id],
  getByUser: (id: string) => ['tweets', 'user', id],
};

export const AddTweet = ({ tweetId }: AddTweetProps) => {
  const queryClient = useQueryClient();

  const mutation = useMutation(
    (content: string) =>
      client('/api/tweets', { method: 'POST', data: { content, tweetId } }),
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: tweetId ? tweetKeys.getById(tweetId) : tweetKeys.all,
        });
      },
    }
  );
  const handleSubmit = (content: string) => mutation.mutate(content);

  return <AddTweetForm disabled={mutation.isLoading} onSubmit={handleSubmit} />;
};
