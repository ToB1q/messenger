'use client';

import { useState } from 'react';
import Image from 'next/image';
import Header from '@/app/components/layout/Header';
import styles from './feed.module.css';

// Типы данных
interface Story {
  id: number;
  username: string;
  avatar: string;
  isViewed: boolean;
  hasNew: boolean;
  image: string;
}

interface Post {
  id: number;
  username: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  share:number;
  isLiked: boolean;
}

export default function FeedPage() {
  const [stories, setStories] = useState<Story[]>([
    { 
      id: 1, 
      username: 'Моя история', 
      avatar: '/cat.jpg', 
      isViewed: false, 
      hasNew: true,
      image: '/68dd056ee60f9.jpg'
    },
    { 
      id: 2, 
      username: 'alex_design', 
      avatar: '/tank.jpg', 
      isViewed: false, 
      hasNew: true,
      image: '/d2b73f8f7bec66dfe31c3fd7a55eba72.jpg'
    },
    { 
      id: 3, 
      username: 'tobi', 
      avatar: '/jdm.jpg', 
      isViewed: true, 
      hasNew: false,
      image: '/jdm.jpg'
    },
    { 
      id: 4, 
      username: 'mouse', 
      avatar: '/zzz.jpg', 
      isViewed: false, 
      hasNew: true,
      image: '/voda.jpg'
    },
  ]);

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      username: 'alex_design',
      avatar: '/tank.jpg',
      time: '2 часа назад',
      content: 'Заканчиваю работу над новым дизайн-системой для крупного проекта. Доволен результатом! 🎉',
      image: '/tank.jpg',
      likes: 124,
      comments: 18,
      share: 0,
      isLiked: false,
    },
    {
      id: 2,
      username: 'tobi',
      avatar: '/jdm.jpg',
      time: '5 часов назад',
      content: 'Сегодня на конференции рассказала о Next.js 15 и новых возможностях App Router. Слайды прикрепляю в комментариях 👇',
      image: '/trueno.jpg',
      likes: 89,
      comments: 34,
      share: 40,
      isLiked: true,
    },
    {
      id: 3,
      username: 'mouse',
      avatar: '/zzz.jpg',
      time: 'вчера',
      content: 'Закат в горах. Ничто не сравнится с этим моментом. 📸',
      image: '/sakura.jpg',
      likes: 256,
      comments: 42,
      share: 106,
      isLiked: false,
    },
    {
      id: 4,
      username: 'mouse',
      avatar: '/zzz.jpg',
      time: 'вчера',
      content: 'Только что вернулась из Барселоны! Город невероятный. Делитесь любимыми местами в Европе в комментариях ✈️🌍',
      likes: 312,
      comments: 67,
      share: 228,
      isLiked: true,
    },
  ]);

  const [activeStory, setActiveStory] = useState<number | null>(null);

  const handleStoryClick = (storyId: number) => {
    setActiveStory(storyId);
    // Отмечаем историю как просмотренную
    setStories(stories.map(story => 
      story.id === storyId 
        ? { ...story, isViewed: true, hasNew: false } 
        : story
    ));
  };

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1 
          } 
        : post
    ));
  };

  const closeStory = () => {
    setActiveStory(null);
  };

  return (
    <div className={styles.container}>
      {/* Шапка ленты */}
      <Header />

      <div className={styles.content}>
        {/* Блок с историями */}
        <div className={styles.storiesSection}>
          <div className={styles.storiesWrapper}>
            <div className={styles.storiesHeader}>
              <h2 className={styles.storiesTitle}>
                Истории
              </h2>
              <button className={styles.showAllButton}>
                Все истории
              </button>
            </div>
            <div className={styles.storiesScroll}>
              {stories.map((story) => (
                <button
                  key={story.id}
                  className={styles.storyItem}
                  onClick={() => handleStoryClick(story.id)}
                >
                  <div className={styles.storyAvatarWrapper}>
                    <div className={`${styles.storyAvatarBorder} ${story.hasNew ? styles.storyNew : ''}`}>
                      <div className={styles.storyAvatar}>
                        <img className={styles.storyAvatarEmoji} src={story.avatar} alt="" />
                      </div>
                    </div>
                    {story.id === 1 && (
                      <div className={styles.addStoryIcon}>
                        <img className={styles.actionIconPlus} src="/plus.svg" alt="" />
                      </div>
                    )}
                  </div>
                  <span className={`${styles.storyUsername} ${story.isViewed ? styles.viewedStory : ''}`}>
                    {story.username}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Лента постов */}
        <div className={styles.feedSection}>
          {posts.map((post) => (
            <article key={post.id} className={styles.post}>
              {/* Шапка поста */}
              <div className={styles.postHeader}>
                <div className={styles.postAuthor}>
                  <div className={styles.postAvatar}>
                    <img className={styles.storyAvatarEmoji} src={post.avatar} alt="" />
                  </div>
                  <div className={styles.postAuthorInfo}>
                    <span className={styles.postUsername}>{post.username}</span>
                    <span className={styles.postTime}>{post.time}</span>
                  </div>
                </div>
                <button className={styles.postMenuButton}>
                  <span>⋯</span>
                </button>
              </div>

              {/* Контент поста */}
              <div className={styles.postContent}>
                <p className={styles.postText}>{post.content}</p>
                {post.image && (
                  <div className={styles.postImage}>
                    <div className={styles.postImagePlaceholder}>
                      <img className={styles.postImageEmoji} src={post.image} alt="" />
                    </div>
                  </div>
                )}
              </div>

              {/* Действия с постом */}
              <div className={styles.postActions}>
                <div className={styles.postActionButtons}>
                  <button 
                    className={`${styles.actionButton} ${post.isLiked ? styles.liked : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    
                    <img className={styles.actionIcon} src={post.isLiked ? '/like_yes.png' : 'like_no.png'} alt="" />
                    <span className={styles.actionLabel}>{post.likes}</span>
                  </button>
                  <button className={styles.actionButton}>
                    <img className={styles.actionIcon} src="/comments.png" alt="" />
                    <span className={styles.actionLabel}>{post.comments}</span>
                  </button>
                  <button className={styles.actionButton}>
                    <img className={styles.actionIcon} src="/share.png" alt="" />
                    <span className={styles.actionLabel}>{post.share}</span>
                  </button>
                </div>
              </div>

              {/* Поле для комментария */}
              <div className={styles.commentBox}>
                <div className={styles.commentAvatar}>
                  <img className={styles.storyAvatarEmoji} src="/cat.jpg" alt="" />
                </div>
                <input 
                  type="text" 
                  className={styles.commentInput} 
                  placeholder="Напишите комментарий..."
                />
                <button className={styles.commentSendButton}>
                  <img className={styles.actionIcon} src="/clip.png" alt="" />
                </button>
              </div>
            </article>
          ))}

          {/* Индикатор загрузки */}
          <div className={styles.loadingIndicator}>
            <div className={styles.loadingSpinner}></div>
            <span>Загружаем новые посты...</span>
          </div>
        </div>
      </div>

      {/* Модальное окно истории */}
      {activeStory && (
        <div className={styles.storyModal} onClick={closeStory}>
          <div className={styles.storyModalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeStoryButton} onClick={closeStory}>
              ✕
            </button>
            {stories.map(story => story.id === activeStory && (
              <div key={story.id} className={styles.storyViewer}>
                <div className={styles.storyHeader}>
                  <div className={styles.storyUserInfo}>
                    <div className={styles.storyUserAvatar}>
                      <img className={styles.storyAvatarEmoji} src={story.avatar} alt="" />
                    </div>
                    <span className={styles.storyUserName}>{story.username}</span>
                    <span className={styles.storyTime}>только что</span>
                  </div>
                </div>
                <div className={styles.storyImage}>
                  <img className={styles.storyImageEmoji} src={story.image} alt="" />
                </div>
                <div className={styles.storyProgress}>
                  <div className={styles.storyProgressBar}></div>
                </div>
                <div className={styles.storyReply}>
                  <input 
                    type="text" 
                    placeholder="Ответить..." 
                    className={styles.storyReplyInput}
                  />
                  <div className={styles.storyActionButtons}>
                    <button className={styles.actionButton}>
                    <img className={styles.actionIcon} src="/like_no.png" alt="" />
                  </button>
                   <button className={styles.actionButton}>
                    <img className={styles.actionIcon} src="/comments.png" alt="" />
                  </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}