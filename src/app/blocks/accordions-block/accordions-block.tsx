"use client";

import { useEffect } from "react";
import { FONT_MONT_BOOK } from "@/app/fonts";
import "./accordions-block.css";
import Image from "next/image";
import AccordionPlus from "../../../../public/accordion-plus.svg";
import { Collapse, CollapseProps } from "antd";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";

const ITEMS: CollapseProps["items"] = [
  {
    key: "1",
    label: (
      <p className={`${FONT_MONT_BOOK.className} accordions-block-label`}>
        Баланс
      </p>
    ),
    children: (
      <p className={`${FONT_MONT_BOOK.className} accordions-block-children`}>
        {`верим, что успех и эффективность руководителя строятся на балансе профессиональных связей, семьи, саморазвития, обучения и физической формы`}
      </p>
    ),
  },
  {
    key: "2",
    label: (
      <p className={`${FONT_MONT_BOOK.className} accordions-block-label`}>
        Совместное развитие
      </p>
    ),
    children: (
      <p className={`${FONT_MONT_BOOK.className} accordions-block-children`}>
        {`создаём пространство, в котором комфортно расти и вдохновлять других, влиять на развитие бизнеса и всей IT-индустрии`}
      </p>
    ),
  },
  {
    key: "3",
    label: (
      <p className={`${FONT_MONT_BOOK.className} accordions-block-label`}>
        Безопасная среда
      </p>
    ),
    children: (
      <p className={`${FONT_MONT_BOOK.className} accordions-block-children`}>
        {`строим тёплое сообщество равных, где поддержка важнее регалий, юмор — часть культуры, а доверие и открытость позволяют вести честные разговоры`}
      </p>
    ),
  },
  {
    key: "4",
    label: (
      <p className={`${FONT_MONT_BOOK.className} accordions-block-label`}>
        Со-создание
      </p>
    ),
    children: (
      <p className={`${FONT_MONT_BOOK.className} accordions-block-children`}>
        {`любая активность сообщества рождается из энергии участников: идей, опыта, запросов и инициатив. здесь созидают вместе — а значит, по-настоящему`}
      </p>
    ),
  },
];

const renderExpandIcon = () => (
  <Image
    src={AccordionPlus}
    alt=""
    aria-hidden="true"
    width={47}
    height={47}
    unoptimized
  />
);

export const AccordionsBlock = () => {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const header = document.querySelector<HTMLElement>("#header");
    const targetBlock =
      document.querySelector<HTMLElement>("#accordions-block");

    if (!header || !targetBlock) return;

    const addBlack = () => header.classList.add("header_black");
    const removeBlack = () => header.classList.remove("header_black");

    const st = ScrollTrigger.create({
      trigger: targetBlock,
      start: "top 70px",
      end: "bottom top",
      refreshPriority: 2, // MainBanner = 0, OurProjects = 1
      onEnter: addBlack,
      onLeave: removeBlack,
      onEnterBack: addBlack,
      onLeaveBack: removeBlack,
    });

    return () => {
      st.kill();
      header.classList.remove("header_black");
    };
  }, []);

  return (
    <section
      className="accordions-block-wrapper"
      id="accordions-block"
      aria-label="Наши ценности"
    >
      <div className={`${FONT_MONT_BOOK.className} accordions-block-title`}>
        наши ценности
      </div>

      <div className="accordions-block-list">
        <Collapse
          ghost={true}
          expandIconPosition="end"
          items={ITEMS}
          className="accordions-block-component"
          defaultActiveKey={["1", "2", "3", "4"]}
          expandIcon={renderExpandIcon}
        />
      </div>
    </section>
  );
};
