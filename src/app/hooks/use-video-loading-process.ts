/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback } from 'react';

export const useVideoLoadingProgress = (videoSelector: string) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const updateProgress = useCallback(() => {
    const video = videoRef.current;
    if (video && video.buffered.length > 0 && video.duration > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const duration = video.duration;
      const progress = Math.min(Math.round((bufferedEnd / duration) * 100), 100);
      setLoadingProgress(progress);
    }
  }, []);

  useEffect(() => {
    // Функция для поиска видео элемента
    const findVideoElement = () => {
      const element = document.getElementById(videoSelector) as HTMLVideoElement;

      if (element && element !== videoRef.current) {
        videoRef.current = element;
        return true;
      }
      return false;
    };

    // Если элемент уже существует
    if (findVideoElement() && videoRef.current) {
      const video = videoRef.current;
      
      if (video.readyState >= 1) {
        updateProgress();
      }
      
      if (video.readyState === 4) {
        setLoadingProgress(100);
      }
    }

    // Используем MutationObserver для отслеживания изменений в DOM
    const observer = new MutationObserver(() => {
      if (!videoRef.current && findVideoElement() && videoRef.current) {
        attachEvents(videoRef.current);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Функция для прикрепления обработчиков событий
    const attachEvents = (video: HTMLVideoElement) => {
      video.addEventListener('progress', updateProgress);
      video.addEventListener('loadedmetadata', updateProgress);
      video.addEventListener('canplaythrough', () => setLoadingProgress(100));
      video.addEventListener('loadeddata', updateProgress);
    };

    // Прикрепляем обработчики если элемент существует
    if (videoRef.current) {
      attachEvents(videoRef.current);
    }

    // Очистка
    return () => {
      observer.disconnect();
      if (videoRef.current) {
        videoRef.current.removeEventListener('progress', updateProgress);
        videoRef.current.removeEventListener('loadedmetadata', updateProgress);
        videoRef.current.removeEventListener('canplaythrough', () => setLoadingProgress(100));
        videoRef.current.removeEventListener('loadeddata', updateProgress);
      }
    };
  }, [videoSelector, updateProgress]);

  return loadingProgress;
};