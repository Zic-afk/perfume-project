import './style.css'
import { createExperience } from './experience.js'
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const editions = [
 { name: 'L’ORIGINEL', color: '#a46316', absorption: '#bf771a', note: 'Тёплый янтарь · цветочная абстракция' },
 { name: 'ÉMERAUDE', color: '#075239', absorption: '#074e35', note: 'Глубокий изумруд · благородная свежесть' },
 { name: 'GRENAT', color: '#63162d', absorption: '#5b1027', note: 'Гранатовый бархат · вечерний характер' },
]
 document.querySelector('#app').innerHTML = `
<div class="stage" aria-hidden="true"><canvas></canvas><div class="grain"></div></div>
<header class="navigation"><a class="nav-brand" href="#home">CHANEL</a><a href="#history">История аромата <span>↗</span></a></header>
<main class="experience" id="home">
<section class="scene-copy hero-copy" aria-labelledby="hero-title"><p class="eyebrow hero-eyebrow">PARIS · DEPUIS 1921</p><h1 id="hero-title">CHANEL</h1><div class="hero-caption"><span>N°5</span><p>Есть ароматы.<br>Есть легенды.</p></div><p class="side-caption">L’ESSENCE DE L’ÉTERNITÉ</p><a class="scroll-cue" href="#history"><span>ПРОКРУТИТЕ, ЧТОБЫ ПОЧУВСТВОВАТЬ</span><i></i></a><span class="edition">EAU DE PARFUM<br>50 ML · MADE IN FRANCE</span></section>
<div class="anchor" id="history"></div>
<section class="scene-copy history-copy" aria-labelledby="history-title"><div class="history-left"><p class="eyebrow">01 / РОЖДЕНИЕ ЛЕГЕНДЫ</p><h2 id="history-title">Номер пять.<br><em>Вне времени.</em></h2><div class="fine-line"></div><p class="body-copy">Аромат как воплощение женщины. Смелой. Свободной. Непохожей на других. История N°5 — это история нового взгляда на красоту.</p></div><div class="history-right"><span class="year">1921</span><p class="eyebrow">ПАРИЖ. НАЧАЛО НОВОЙ ЭПОХИ.</p><p class="body-copy">Габриэль Шанель и парфюмер Эрнест Бо. Встреча, подарившая миру цветочную абстракцию. Пятый образец. Простое имя. Начало легенды.</p><p class="history-signature">Простота формы.<br>Бесконечность содержания.</p></div><span class="section-foot">CHANEL N°5 — ИСКУССТВО БЫТЬ СОБОЙ</span></section>
<div class="anchor final-anchor" id="fragrance"></div>
<section class="scene-copy fragrance-copy" aria-label="Коллекция ароматов"></section>
</main><div class="chapter-index" aria-hidden="true"><span class="chapter-current">01</span><span class="chapter-track"><i></i></span><span>03</span></div><div class="render-fallback" hidden>Для просмотра объёмного флакона включите WebGL в браузере.</div>`
document.querySelector('.fragrance-copy').innerHTML = `
 <p class="eyebrow collection-heading">02 / LA COLLECTION PRIVÉE</p>
 <h2 class="collection-title">Три грани <em>одной легенды.</em></h2>
 <aside class="collection-aside aside-left"><span class="ornament">✧</span><p>PARIS<br>1921</p><i></i><span>НАСЛЕДИЕ<br>В КАЖДОЙ ДЕТАЛИ</span></aside>
 <div class="collection-frame"><span class="frame-top">LES ÉDITIONS · N°5</span><span class="frame-corner">I — III</span><div class="bottle-controls" role="group" aria-label="Выберите флакон">${editions.map((edition, index) => `<button type="button" class="bottle-choice" data-edition="${index}" aria-label="${edition.name} — переместить в центр" aria-pressed="${index === 0}"><span>${edition.name}</span></button>`).join('')}</div><span class="frame-bottom">EXTRAORDINARY BY NATURE</span><span class="frame-volume">50 ML</span></div>
 <aside class="collection-aside aside-right"><span>СОЗДАНО,<br>ЧТОБЫ ОСТАТЬСЯ</span><i></i><p>EAU<br>DE PARFUM</p><span class="ornament">✧</span></aside>
 <div class="selection-caption" aria-live="polite"><span class="selected-name">L’ORIGINEL</span><p class="selected-note">${editions[0].note}</p><small>ВЫБЕРИТЕ ФЛАКОН — ПУСТЬ ОН СТАНЕТ ГЛАВНЫМ</small></div>`
document.querySelector('.experience').insertAdjacentHTML('beforeend', `
 <div class="anchor contact-anchor" id="contacts"></div>
 <section class="scene-copy contact-copy" aria-labelledby="contact-title">
  <p class="eyebrow">03 / ОСТАНЕМСЯ НА СВЯЗИ</p>
  <h2 id="contact-title">Продолжим<br><em>знакомство.</em></h2>
  <div class="contact-list">
   <div><span>ЭЛЕКТРОННАЯ ПОЧТА</span><p>bonjour@parfum.example</p><small>Заказы и сотрудничество</small></div>
   <div><span>ТЕЛЕФОН</span><p>+7 (000) 000-00-00</p><small>Ежедневно · 10:00–19:00</small></div>
   <div><span>СОЦИАЛЬНЫЕ СЕТИ</span><p>Telegram · VK · Instagram</p><small>Ссылки на ваши страницы — скоро</small></div>
   <div><span>АДРЕС ШОУРУМА</span><p>По предварительной записи</p><small>Город и адрес будут добавлены</small></div>
  </div>
  <p class="contact-demo-note">Демонстрационные контакты · будут заменены на ваши</p>
  <footer><span>CHANEL</span><p>Независимый дизайн-концепт · 2026</p><a href="#home">К началу ↑</a></footer>
 </section>`)
document.querySelector('.fragrance-copy').insertAdjacentHTML('beforebegin', `
 <section class="scene-copy macro-copy" aria-labelledby="macro-title">
  <div class="editorial-copy"><p class="eyebrow">02 / ИСКУССТВО ДЕТАЛИ</p>
   <h2 id="macro-title">Красота.<br><em>В каждой грани.</em></h2>
   <p class="body-copy">Прохлада стекла. Тёплое золото. Чистота линий, в которых нет ничего случайного.</p>
   <span class="editorial-rule"></span><p class="detail-caption">СТЕКЛО · ЗОЛОТО · ПРИКОСНОВЕНИЕ</p>
  </div><span class="section-foot">ПРИБЛИЗЬТЕСЬ К НЕЗАМЕТНОМУ</span>
 </section>
 <section class="scene-copy aroma-copy" aria-label="Композиция аромата">
  <div class="aroma-panel" data-note="top"><p class="eyebrow">03 / КОМПОЗИЦИЯ · ПЕРВОЕ ВПЕЧАТЛЕНИЕ</p><h2>Воздух.<br><em>Наполненный светом.</em></h2><p class="body-copy">Искрящийся аккорд альдегидов. Лёгкость первого вдоха — начало истории, которую хочется продолжить.</p><span class="note-latin">LES ALDÉHYDES</span></div>
  <div class="aroma-panel" data-note="heart"><p class="eyebrow">03 / КОМПОЗИЦИЯ · СЕРДЦЕ АРОМАТА</p><h2>Цветы.<br><em>Без границ.</em></h2><p class="body-copy">Майская роза и жасмин. Нежные лепестки складываются в абстракцию, которая звучит по-своему на каждой коже.</p><span class="note-latin">ROSE & JASMIN</span></div>
  <div class="aroma-panel" data-note="base"><p class="eyebrow">03 / КОМПОЗИЦИЯ · ПОСЛЕВКУСИЕ</p><h2>Тепло.<br><em>Которое остаётся.</em></h2><p class="body-copy">Мягкие древесные оттенки. Глубокий, спокойный шлейф — память о мгновении, которое уже стало вашим.</p><span class="note-latin">LES BOIS PRÉCIEUX</span></div>
  <div class="note-progress" aria-hidden="true"><span data-note-step="top">01 · ВЕРХНИЕ НОТЫ</span><span data-note-step="heart">02 · СЕРДЦЕ</span><span data-note-step="base">03 · ШЛЕЙФ</span></div>
 </section>
 <section class="scene-copy spray-copy" aria-labelledby="spray-title"><div class="editorial-copy"><p class="eyebrow">04 / ИСКУССТВО МГНОВЕНИЯ</p><h2 id="spray-title">Один жест.<br><em>Долгое эхо.</em></h2><p class="body-copy">Невесомое облако. Прикосновение к коже. И ваш собственный след в воздухе.</p><span class="editorial-rule"></span><p class="detail-caption">СВЕТ. ВОЗДУХ. ПРИСУТСТВИЕ.</p></div><span class="section-foot">АРОМАТ НАЧИНАЕТСЯ С ВАС</span></section>
`)
document.querySelector('.collection-heading').textContent = '05 / LA COLLECTION PRIVÉE'
document.querySelector('.contact-copy > .eyebrow').textContent = '06 / ОСТАНЕМСЯ НА СВЯЗИ'
document.querySelector('.chapter-index > span:last-child').textContent = '07'
const title = document.querySelector('#hero-title')
title.setAttribute('aria-label', 'CHANEL')
title.innerHTML = [...title.textContent].map(letter => `<span class="hero-title-letter" aria-hidden="true">${letter}</span>`).join('')
createExperience(editions, reducedMotion)

