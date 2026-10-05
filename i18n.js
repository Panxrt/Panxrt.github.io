'use strict';
let language=localStorage.getItem('panxrt-language')==='ru'?'ru':'en',translationRun=0;
const originals=new WeakMap();
const translations={
 'ABOUT':'ОБО МНЕ','WORK':'РАБОТЫ','CONTACTS':'КОНТАКТЫ','INTRO':'ГЛАВНАЯ','DESIGN':'ДИЗАЙН','MOTION':'МОУШН','Design portfolio 26’':'Дизайн-портфолио 26’','VALERII PANCHENKO':'ВАЛЕРИЙ ПАНЧЕНКО',
 '2D & 3D animation':'2D- и 3D-анимация','Key visuals & design systems':'Ключевые визуалы и дизайн-системы','Merch design':'Дизайн мерча','Print & packaging':'Полиграфия и упаковка','AI image-making':'Создание изображений с ИИ',
 'Graphic & Motion Designer working at the intersection of':'Графический и моушн-дизайнер. Работаю на стыке',
 'branding, advertising, animation, 3D and AI.':'брендинга, рекламы, анимации, 3D и ИИ.',
 'I take projects from idea to final delivery, creating visuals that catch the eye and solve a business challenge.':'Веду проекты от идеи до финала: создаю визуал, который привлекает внимание и решает бизнес-задачу.',
 'Design & motion toolkit':'Инструменты дизайна и анимации','AI toolkit':'Инструменты ИИ','View all work':'Смотреть все работы','View full project':'Смотреть проект целиком','CLOSE ×':'ЗАКРЫТЬ ×','BACK':'НАЗАД','Email':'Почта','About me':'Обо мне','Work':'Работы',
 'CASE STUDY / PLACEHOLDER':'КЕЙС / ЗАГЛУШКА','The brief':'Задача','The approach':'Решение','The outcome':'Результат','Back to all work':'Вернуться к работам','A space for the story behind the work.':'Место для истории проекта.'
};
window.portfolioLanguage=()=>language;
window.translatePage=function(animate=false){
 const run=++translationRun,changes=[];document.documentElement.lang=language;document.body.classList.toggle('language-ru',language==='ru');
 document.querySelectorAll('.language-switch').forEach(b=>{b.textContent=language==='ru'?'EN':'RU';b.setAttribute('aria-label',language==='ru'?'Switch to English':'Переключить на русский');});
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){
  if(node.parentElement?.closest('script,style,template,svg,.brand-track,.tool-item,.language-switch'))continue;
  let original=originals.get(node);if(original===undefined){original=node.nodeValue;originals.set(node,original);}
  const key=original.trim();if(!translations[key])continue;
  const target=language==='ru'?original.replace(key,translations[key]):original;
  if(node.nodeValue!==target)changes.push([node,target]);
 }
 if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){changes.forEach(([n,t])=>n.nodeValue=t);return;}
 const start=performance.now(),alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
 function tick(now){if(run!==translationRun)return;const p=Math.min(1,(now-start)/520);for(const [n,t]of changes)n.nodeValue=p===1?t:[...t].map((c,i)=>/\s/.test(c)||i<t.length*p?c:alphabet[Math.floor(Math.random()*alphabet.length)]).join('');if(p<1)requestAnimationFrame(tick);}
 requestAnimationFrame(tick);
};
document.addEventListener('click',event=>{if(!event.target.closest('.language-switch'))return;language=language==='ru'?'en':'ru';localStorage.setItem('panxrt-language',language);document.dispatchEvent(new Event('portfolio-language'));window.translatePage(true);});
window.translatePage(false);
