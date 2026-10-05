// Галерея «society»: сейчас у всех 14 фото стоит priority (грузятся вместе с первым экраном)
// и нет sizes (телефону 360px отдаётся 1920px). Было:
//   <Image src={bU} priority alt="" className="society-photos-block-img ..." />
// Стало: priority убран, sizes задан, первое фото грузится чуть раньше остальных.
import Image from 'next/image';

export const SocietyPhoto = ({ src, index, active }: { src: any; index: number; active: number }) => (
  <Image
    src={src}
    alt="Участники South HUB на встрече сообщества"
    sizes="100vw"
    quality={70}
    loading={index === 0 ? 'eager' : 'lazy'}
    fetchPriority={index === 0 ? 'auto' : 'low'}
    className={`society-photos-block-img society-photos-block-img-${index === active ? 'visible' : 'hidden'}`}
  />
);

// Фото проектов (встречи, ютуб, тг, эфир): добавить sizes, иначе телефону уходит 1080px.
//   <Image src={meet} width={900} height={536} sizes="(max-width: 1024px) 100vw, 900px" alt="Клубные встречи South HUB" />
