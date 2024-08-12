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
  useQueryClient,
} from '@tanstack/react-query';
import { Error } from '~/components/Error';
import { useEffect, useRef } from 'react';

const notifyFailed = () => toast.error("Couldn't fetch tweet...");

const getTweets = async (signal?: AbortSignal, page = 0) =>
  client(`/api/tweets?page=${page}`, { signal, zodSchema: TweetsScheme });

const useInfiniteTweets = () =>
  useInfiniteQuery({
    queryKey: ['tweets'],
    queryFn: ({ signal, pageParam }) => getTweets(signal, pageParam),
    onError: () => notifyFailed(),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

export default function FetchAllTweets() {
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteTweets();

  if (isLoading) return <Loader />;

  if (isError) return <Error error="Impossible to fetch..." reset={refetch} />;

  const tweets = data.pages.flatMap((page) => page.tweets);

  return (
    <TwitterLayout>
      <AddTweet />
      {tweets.map((tweet) => (
        <Tweet key={tweet.id} tweet={tweet}>
          <RepliesButton count={tweet._count.replies} />
          <LikeButton count={tweet._count.likes} liked={tweet.liked} />
        </Tweet>
      ))}
      <NextButton
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
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

const useOnVisible = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void
) => {
  useEffect(() => {
    if (!ref.current) return;

    const current = ref.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(current);

    return () => {
      observer.unobserve(current);
    };
  }, [ref, callback]);

  return ref;
};

type NextButtonProps = {
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => void;
};

export const NextButton = ({
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: NextButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  useOnVisible(ref, fetchNextPage);

  const nextPageStatus = hasNextPage
    ? 'Loading...'
    : 'There is not more tweets';

  return (
    <button ref={ref} className="block py-4">
      {isFetchingNextPage ? 'Loading more...' : nextPageStatus}
    </button>
  );
};
