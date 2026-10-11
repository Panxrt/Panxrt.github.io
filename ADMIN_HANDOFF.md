## Continuation — 2026-10-11 21:49 Europe/Budapest
- Owner reported secret entry/save completed. Render Environment left edit mode; secret value was never read. Validity not yet verified.
- Restarted test service, then manually deployed working branch commit 3c5d435 to apply saved config. Render confirmed Deploy succeeded / Live, duration 47.1s; nine tests passed in build (also nine local tests passed).
- Public test /admin/ visibly renders PANXRT CMS login screen.
- Clicking its GitHub login link via browser tooling was blocked by browser URL protocol policy, leaving chrome-error page. Do not bypass via fetch/CDP/alternate execution. Returned only to safe /admin/ for owner manual sign-in handoff.
- Real OAuth/private save/preview/test publish remain UNVERIFIED. Next: owner manually clicks GitHub login in prepared CMS tab; inspect outcome, then test private content vertical scenario.
- No production/main/DNS/media changes. Auto deploy off; only isolated Free test service deployed.

# Latest setup checkpoint — 2026-10-11 evening

This section supersedes historical blockers below. Do not repeat the audit.
- Render Free isolated service is deployed at https://panxrt-cms-test.onrender.com; afternoon browser verification of /admin/ showed the PANXRT CMS test login screen. Nine tests passed in Render build. No live OAuth/write test has passed.
- GitHub App callback was SAVED successfully as https://panxrt-cms-test.onrender.com/auth/callback (GitHub success alert verified). Earlier localhost/pending-sudo notes below are historical.
- Evening Render login via previously selected GitHub method succeeded: Environment screen for srv-db5of9nlot8c73flnk6g visible.
- Saved environment still lacked GITHUB_CLIENT_SECRET. Prepared an UNSAVED empty variable row with that name for owner entry; no secret generated, read, entered, or committed.
- GitHub credentials settings currently requires renewed Confirm access / Verify via email. Owner must generate client secret and enter it directly into Render, then Save only. Browser safety requires owner handoff for creation/entry/submission of new authentication credentials.
- Current live /auth/login inspection hit a browser URL-policy protocol block after earlier Render wake-up page; stopped that browser action. Do not misreport this as an application failure or successful login.
- Next: owner completes secret setup, restart/deploy ONLY isolated Free service, verify actual CMS OAuth then private draft save/reload, preview, test publication and restore. Auto-deploy remains OFF; no production/main/DNS/media changes.
- Private repository and App installation already exist and were verified. Do not recreate them. No App private key needed for implemented user-to-server flow.

---

## Setup continuation — 2026-10-10, awaiting browser sign-in

Owner explicitly authorized creating `Panxrt/panxrt-cms-private`, seeding content/test branch, and registering/installing a minimally scoped GitHub App only on that private repo. Server hosting requires a free proposal and separate owner consent before deployment.

Read cms/SETUP.md; working checkout was clean. Connector has file/branch operations but no repository creation/App registration operation. Opened GitHub creation page in cloud browser; it requires sign-in. Secure browserAuth flow started; authentication has not succeeded and user continuation is required. No credentials were returned to the agent, stored in files or committed. No repo/App, secrets, hosting, DNS or media changes were made. No new real CMS integration tests passed in this attempt. Resume the existing browser sign-in via supported secure handoff, verify signed-in Panxrt identity, then create the private repo and proceed with the setup guide. Do not repeat the audit or request passwords in chat.

---

# Current implementation status — 2026-10-10 (session 1)

**This section supersedes historical status statements below.** Working branch: [`feature/admin-cms-20261010`](https://github.com/Panxrt/Panxrt.github.io/tree/feature/admin-cms-20261010).
Base main: `db4e6864abcf5b23085702c81df35ea6f5d6127c` (confirmed unchanged before implementation). Initial handoff commit: [`0e713ec`](https://github.com/Panxrt/Panxrt.github.io/commit/0e713ecd307dd6c039c5947f43eec6c88185fcbe).
Use the branch HEAD/history for the latest implementation commit (a file cannot name its own commit SHA).

## Implemented in the working branch

- [x] Created branch from current main, committed this complete handoff first. No merge/deployment/DNS/media changes.
- [x] Fixed prototype `floating-add` lookup to existing `addWorkBtn`. Preview iframe now supplies `window.portfolioData` to the shared MosaicLayout renderer.
- [x] Added dependency-free Node >=22 CMS backend (`cms/server.mjs`, `auth.mjs`, `store.mjs`). This is a local/isolated server adapter, **not a deployed Cloudflare Worker**.
- [x] GitHub App user-to-server OAuth: state, PKCE, browser binding, owner ID allowlist (156057823), expiring server-side sessions, HttpOnly cookies, Origin + CSRF for writes. Tokens/secrets never sent to the editor or localStorage.
- [x] Private Git store: remote draft read/save with expected head SHA, non-force Git ref update, version list and restore as a NEW content-only commit; revision increment on saves. Only `content.json` can be written. Public repository `Panxrt/Panxrt.github.io` is explicitly rejected; repository `private:true` checked before operations.
- [x] TEST publication to `cms-test-published` in the private repository only. Response explicitly says `deployment:false`; no fake Pages deployment success. Authenticated `/preview/` and `/test-preview/` use existing site assets with private JSON. Raw private JSON also requires a session and is no-store.
- [x] Reused old editor code in `admin-cms/`, not a replacement from scratch: gallery drag/reorder, eight resize handles, proportional/free modes, crop/focal/zoom, native ratio and presets, row count/rowSpan controls; case blocks, free/flow layout, inline text, rotation, rulers/guides, Shift multi-select, ALIGN, order/layers, duplicate/delete, brands/category CRUD/order. **Ported code is not yet visually/browser-validated.**
- [x] Adapted editor save/load to private CMS. Added Undo/Redo, independent EN/RU editing, draft download for conflict recovery, remote reload, history restore and test publication UI. Legacy case opening no longer automatically converts every layout to free canvas. Added text color/line-height in editor renderer; isolated preview uses this same renderer.
- [x] Preserved upload/statistics client source in `cms/reference/` for next adapters. These are not loaded/exposed. Direct uploads and analytics are NOT connected; UI says so. No 25 MB media upload limit was introduced. JSON request limit is 4 MiB, unrelated to media.
- [x] Setup instructions: [`cms/SETUP.md`](https://github.com/Panxrt/Panxrt.github.io/blob/feature/admin-cms-20261010/cms/SETUP.md).

## Verification actually performed

`node --test cms/test/*.test.mjs` — **9 passing tests**. Tests cover OAuth binding/PKCE/owner rejection, private-only storage guards, unsafe URLs/duplicate IDs, normal and simultaneous save conflicts, save→private preview→TEST publication→restore through real local HTTP with mock GitHub transport, session logout/CSRF, prototype renderAll against actual HTML IDs, script parse/control presence, original 35-card packing and multi-row non-overlap, proportional scaling and ALIGN.

This is NOT live OAuth/GitHub integration QA, browser QA, a real remote test deployment, cross-device testing or iOS validation. Do not claim those passed. No browser-control tool was available in the managed environment, so no browser server/installation workaround was used. Public files/media/production main are unchanged except **branch-only** prototype edits; all new implementation is under `cms/` and `admin-cms/`.

## Blocking owner setup (exact instructions in cms/SETUP.md)

1. Create PRIVATE `Panxrt/panxrt-cms-private`, initialize with README and existing `content.json`, then branch `cms-test-published` from that private main. No Pages there. Confidential drafts must never be saved in this public development branch.
2. Register GitHub App with Contents read/write, only install on that PRIVATE repository, owner account only. Local callback `http://localhost:8787/auth/callback`. Client secret only in server environment, never in chat/files/commits. No App private key required for this user-to-server implementation.
3. Run Node test server and complete real login/draft/test-publication checks. Before remote hosting select/approve a free provider; adapt the Node HTTP/session layer and verify from Russia. No account, paid service, private repo or App was created by this session.

## Next task and remaining work (do not repeat audit)

**Next: connect the private repo + GitHub App, run real vertical scenario, then browser-QA and repair the ported Gallery/Case editors.** See setup guide. All saved code can be progressed without changing production.

- [ ] Remote test deployment/provider adapter. Memory sessions currently single-process, lost on restart, expire within 1h; refresh and distributed storage are not implemented.
- [ ] Live auth/private Git read/write, second device, failures/retries, history/publish/restore acceptance.
- [ ] Browser tests for all eight handles, crop, flow/free case gestures, text, guides/ALIGN, mobile previews, original media and smoothness. The old interaction code may need further compatibility fixes.
- [ ] Gallery explicit row add/delete/move, per-row card membership, spans beyond current 3, visibility toggle, conflict UI and intentionally separate mobile layout. Current renderer still inherits old silent row fitting; don't call the full desired row editor finished.
- [ ] Public integration of new text color/line-height and independent language renderer, hidden-work handling and sections. Current isolated preview uses the amended renderer, public renderer untouched.
- [ ] INTRO/ABOUT/CONTACTS structured editor; full Undo/Redo edge cases/keyboard shortcuts; view zoom; recoverable pending changes across browser crash (currently download + dirty warning, not persistent autosave).
- [ ] Media adapters, actual resumable uploads/progress/retry, media metadata; preserve both Dropbox URLs. Existing upload code retained for adaptation. No compression/transcoding without approval.
- [ ] Statistics backend/consent as appropriate/exclude owner; don't store event stream in Git commits.
- [ ] Production publish + actual Pages deployment verification + restore only after separate authorization. Current backend deliberately cannot write to public repo.

No new private draft content, secrets, or media committed to this public branch. Historic audits and requirements below are preserved in full.

---

# Implementation session — 2026-10-10

Working branch: `feature/admin-cms-20261010`, based on main `db4e6864abcf5b23085702c81df35ea6f5d6127c`. This document is now committed. Historical status statements below describe the state before this session. Production changes and infrastructure deployment are NOT authorized.

# PANXRT CMS — передача проекта следующей сессии WORK

**Дата фиксации:** 10 октября 2026. **Статус:** ПОДГОТОВИТЕЛЬНЫЙ ДОКУМЕНТ, СОЗДАННЫЙ В ЧАТЕ, НЕ КОММИТ В GITHUB. По сообщению владельца, в последней сессии WORK лимит закончился, ничего не было сделано. Поэтому нельзя считать, что рабочая ветка, GitHub App, API, база, админка или другие файлы уже созданы. Сверить с репозиторием до действий.

## 0. Важнейшее указание для продолжения

Не начинай заново полный аудит. Используй этот handoff и два приложенных ниже отчёта WORK как исходный контекст; кратко проверь изменяемые факты и состояние GitHub. Первое реальное действие после разрешения владельца — создать отдельную ветку от актуальной main и закоммитить в неё этот файл в качестве `ADMIN_HANDOFF.md` (обнови статусы и ссылку на коммит). Далее последовательно реализовывать проверяемые этапы, оставляя `main`, production, DNS и медиа нетронутыми до отдельного разрешения. В конце КАЖДОЙ сессии обновлять этот файл и коммитить результаты в рабочую ветку.

## 1. Проект и известные источники

- Сайт: https://panxrt.win/ (владелец проверил доступность в России без VPN; сохранение доступности критично)
- Код: https://github.com/Panxrt/Panxrt.github.io ; GitHub уже подключён к аккаунту ChatGPT, но доступ конкретной сессии WORK надо проверять.
- Старый сайт: https://p.panxrt.chatgpt.site/ ; старая админка: https://p.panxrt.chatgpt.site/admin . Ранее HTTP 403 снаружи, реальный авторизованный UI не проверен; доступные исходники старой админки описаны в отчёте.
- Прототип новой админки: https://panxrt.win/admin-preview-v60/ ; он НЕ связан с production по записи, хранение через localStorage, PUBLISH отключена.
- На 10 октября аудит WORK сообщал: `main` на коммите `db4e6864abcf5b23085702c81df35ea6f5d6127c`, GitHub Pages; `content.json` — 35 работ, 8 брендов, 4 категории, ревизия 119. Ветки `dev-admin` (устаревшая) и `backup-v60-final`. Ничего из этого не считай гарантированно актуальным без короткой проверки.
- Стек: статические HTML/CSS/JavaScript. Компоненты: `mosaic-layout.js`, `case-renderer.js`, `content.js`, `media-viewer.js`, `view-state.js`, `script.js`, `interaction.js`.
- Два видео (Fava и Motion Showreel) уже подключены через Dropbox Basic; не менять их ссылки без согласования. WORK подтвердил Range для Motion Showreel, но при тесте Fava получил Dropbox login HTML; это не доказательство неработоспособности в браузере владельца.
- В Organix есть две ссылки на отсутствующие в репозитории медиа (согласно аудиту), нужно выяснить фактическую доступность, а не удалять автоматически.
- Прототип админки падал в `renderAll()` из-за ссылки на `floating-add`, которого нет в HTML (имеется `addWorkBtn`). Не исправлено по последнему сообщению владельца.

## 2. Утверждённая архитектура и принципы

1. **GitHub-first CMS**: текущий публичный сайт остаётся на GitHub Pages, репозиторий хранит код и контент (JSON, конфигурации, версии), без обязательной базы данных на старте.
2. **Вход/запись**: отдельная безопасная авторизация, предпочтительно GitHub App с минимумом разрешений для одного репозитория + небольшая серверная функция/API для хранения секретов, проверки прав и ограничений пути. Нельзя держать GitHub токены в публичном JS и localStorage.
3. **Черновики должны быть приватными**. Черновики в ветках ПУБЛИЧНОГО репозитория не приватны! Согласован принцип конфиденциальности, но технический способ ещё надо выбрать (например, приватный репозиторий черновиков или отдельное закрытое хранилище). Ничего платного и внешнего без согласования.
4. **SAVE DRAFT → PREVIEW → PUBLISH → RESTORE**: сохранять серверный/удалённый черновик; предпросмотр на тех же рендерерах; публикация через защищённую запись в GitHub и проверку фактического деплоя GitHub Pages; откат только контента с сохранением новых исправлений кода. Версионность, контроль конфликтов, устойчивость при падении.
5. **Медиа**: GitHub хранит ссылки и небольшие assets; большие изображения/видео в независимом внешнем хранилище при необходимости. Сейчас два видео оставить в бесплатном Dropbox Basic. Админка должна поддерживать ссылки, предпросмотр, постеры, пропорции/фокус, и расширяемые адаптеры медиа; прямые загрузки в Dropbox потребуют отдельного OAuth-разрешения. Бесплатный Dropbox имеет ограниченный объём/трафик; не обещать безлимит. Не ломать историю публикаций при замене медиа.
6. **Расходы**: предпочтительно дополнительные $0, никаких подписок, карт, R2, D1, DNS-правок, изменения hosting или production без отдельного согласования. Привлекательный вариант API — бесплатный Cloudflare Worker или другая доступная площадка, но публичный panxrt.win не должен зависеть от Worker; доступность нового адреса из России отдельно проверяется. При выборе API проверить актуальные квоты и ограничения.
7. **Исходный дизайн и анимации неизменны**. Никакого редизайна, массовой зачистки CSS, изменения переходов, жестов, привязки gallery/case, принудительной конвертации сетки. Существующие 35 работ и порядок надо сохранить. Сайту должно быть доступно обновление на открытом кейсе с восстановлением текущего места.
8. **Работа в отдельной ветке и изолированном тестовом окружении**. Не пушить в main и не публиковать в production без явного отдельного решения владельца.

## 3. Критический функционал — не сокращать

### Галерея WORK
- Создать, удалить, дублировать, скрыть проект; менять имя, описание, категорию, обложку, изображение и видео, порядок, активность полного кейса.
- Полноценный визуальный drag-and-drop с местом вставки, предпросмотром и отменой.
- Размер за восемь ручек и отдельные режимы свободного/пропорционального масштабирования, исходных пропорций, быстрые 1:1/4:5/16:9, независимый crop/cover/contain, фокус, zoom внутри карточки.
- Явное добавление/удаление/перестановка рядов, **своё количество карточек в каждом ряду**, размеры отдельных элементов, растягивание на 2–3 и более строк/колонок, перенос между рядами без поломки текущей композиции.
- Не обещать математически несовместимые произвольные размеры плюс отсутствие дыр во всех случаях: показывать конфликты и варианты исправления, НЕ молча менять выбор владельца.
- Мобильная раскладка — отдельное адаптивное представление; не разрушать десктопную.

### Внутренний визуальный редактор кейсов
- Редактирование на холсте WYSIWYG через общие рендереры, без необходимости писать JSON/HTML/CSS вручную.
- Изображения/видео/текст, inline-редактирование текста (шрифт, размер, вес, курсив, цвет, line-height, выравнивание), блоки в рядах, растягивание, произвольные композиции, изменение порядка, поворот, crop, дублирование/удаление.
- Два режима — свободный холст и вертикальная блочная сборка; сохранять существующие кейсы без автоматической перестройки.
- Линейки, направляющие, snap, Shift/мультивыделение, ALIGN, распределение, слои, Undo и Redo, масштаб просмотра, desktop/tablet/mobile preview.

### Другие разделы
- Бренды и бегущая строка (добавить/удалить/заменить/сортировать логотипы), INTRO, ABOUT, CONTACTS, категории, контакты/ссылки, EN/RU без перезаписи перевода.
- Статистика из старой админки — желательно отдельный раздел; event analytics не хранить через коммиты Git, оценить бесплатную опциональную систему, не блокирующую публичный сайт.

### Приёмочные проверки
- Вход, draft, preview, publish, фактический деплой, restore; повторное открытие на другом устройстве, конфликт сохранения; восстановление после неудачной публикации.
- Добавить тестовый проект с медиа, растянуть через 2–3 строки, проверить отсутствие пересечений и управляемость рядов.
- Редактор кейса: добавить, переставить, изменить размеры, редактировать текст, проверить сохранение и публичную страницу.
- Не сломать текущие анимации/переходы/мобильные жесты/восстановление позиции после reload; не сломать два Dropbox видео, проверить Organix.
- Сравнить эталонные desktop/mobile скриншоты до и после.

## 4. Ближайший план после возобновления лимитов

- [ ] **Проверить доступ к GitHub и текущее состояние `main`**. Не проводить повторный многочасовой аудит, если существенных изменений нет.
- [ ] **Создать отдельную ветку от актуальной `main`** (например, `feature/admin-cms`) и зафиксировать этот `ADMIN_HANDOFF.md` одним коммитом; дать владельцу ссылки на ветку, файл и коммит. НЕ трогать `main`.
- [ ] **Уточнить и согласовать с владельцем** точную реализацию приватных черновиков, auth и площадку малого API (если для этого нужно подключение пользователя, спросить, не просить пароли в чате).
- [ ] Первый проверяемый функциональный вертикальный сценарий в тестовом окружении: login → private draft → preview → publish to TEST deployment → restore. Никаких изменений production.
- [ ] Исправить `floating-add` / `addWorkBtn` и убедиться, что прототип запускается; переносить функции старой админки поэтапно.
- [ ] Полный редактор WORK → полный редактор кейсов → бренды/категории/другие разделы → статистика (если согласована) → медиа-адаптеры/тесты.
- [ ] Каждую завершённую часть коммитить и обновлять этот файл со статусами, ссылками, ограничениями, оставшимися действиями. Не заявлять о выполненных тестах, если их не проводили.

## 5. Статус на 10 октября 2026

- [x] Предварительный аудит сайта и старой админки проведён в WORK; см. Приложение A.
- [x] GitHub-first архитектура предложена WORK и в принципе согласована владельцем; см. Приложение B.
- [x] Владелец выбрал приватные черновики и предпочтение бесплатных сервисов.
- [ ] Создание рабочей ветки — **не подтверждено / пользователь сообщил, что WORK ничего не сделал**.
- [ ] Коммит файла handoff в GitHub — **не подтверждён / не сделан этой беседой**.
- [ ] Исправление ошибки в прототипе — **не подтверждено**.
- [ ] API/auth, реальное сохранение и публикация — **не реализованы по состоянию аудита**.
- [ ] Полноценные редакторы/тесты — **не реализованы в новом сайте**.

## 6. Требования к отчёту в конце КАЖДОЙ сессии

Обнови этот файл в рабочей ветке и в сообщении владельцу дай: (1) ссылку на ветку, (2) ссылку на последний коммит и handoff, (3) что реально сделано и протестировано, (4) ошибки и блокеры, (5) конкретную следующую задачу. Если лимит близок к концу — ПРИОРИТЕТ сохранению/коммиту прогресса, не начинай несохраняемые изменения.

---

# Приложение A. Первый аудит WORK — полный оригинальный текст

Аудит выполнен. **Код, ветки, настройки домена и публикацию я не менял.**

Главный вывод: действующий сайт можно подключить к полноценной CMS без редизайна. Но нынешний прототип админки — локальный редактор, а не работающая система управления сайтом. Нужно добавить серверное сохранение, загрузку медиа, авторизацию и публикацию, используя существующие модули галереи и кейсов.

**Что найдено в GitHub**

| Параметр | Результат |
|---|---|
| Репозиторий | [Panxrt/Panxrt.github.io](https://github.com/Panxrt/Panxrt.github.io) |
| Основная ветка | `main` |
| Последний коммит | `db4e6864abcf5b23085702c81df35ea6f5d6127c`, 7 октября |
| Последнее изменение | Подключение внешних видео Fava и Motion Showreel |
| Стек нового сайта | HTML, CSS, обычный JavaScript; без React и серверного приложения |
| Развёртывание | GitHub Pages; последняя сборка успешно завершена |
| Домен | В `CNAME` указан `panxrt.win` |
| Прототип админки | Папка `admin-preview-v60/` в `main` |
| Дополнительные ветки | `dev-admin`, `backup-v60-final` |

Публичные `index.html` и `content.json` побайтово совпали с файлами текущей `main`. Это вместе с успешным развёртыванием подтверждает проверенную исходную версию.

Ветка `dev-admin` отстала от `main` на 71 коммит и содержит 10 собственных коммитов. Её `admin/admin.js` совпадает с кодом опубликованного прототипа. **Начинать работу с этой устаревшей ветки или целиком вливать её в `main` не стоит.**

Ветка `backup-v60-final` существует, но это резервная версия кода, а не подтверждённая резервная копия всех медиа и базы старого сайта.

**Доступность и границы проверки**

| Адрес | Результат |
|---|---|
| `panxrt.win/` | HTTP 200; интерфейс открыт в браузере |
| `panxrt.win/admin-preview-v60/` | HTTP 200; интерфейс открыт, обнаружена ошибка JavaScript |
| `p.panxrt.chatgpt.site/` | Из среды проверки получен HTTP 403 |
| `p.panxrt.chatgpt.site/admin` | Из среды проверки получен HTTP 403 |

Старую админку я изучал **по доступным исходникам**, включая клиентский редактор, серверное сохранение, авторизацию, загрузчик и статистику. Авторизованный интерфейс старой админки в этом аудите не проверен. Актуальное содержимое её базы и хранилища также не выгружалось.

Cloudflare как действующий backend **нового** сайта не подтверждён. Новый сайт сейчас отдаётся GitHub Pages. Наличие Cloudflare-совместимого сервера у старого проекта не означает, что его база и хранилище доступны в твоём собственном Cloudflare-аккаунте.

**Как устроен новый сайт**

Сейчас `content.json` содержит **35 работ, 8 брендов и 4 категории**.

| Часть | Существующий механизм | Что подключать к CMS |
|---|---|---|
| INTRO | Разметка в `index.html`, переводы, отдельная лента брендов | Тексты, услуги, бренды, параметры ленты |
| ABOUT | Разметка, инструменты и переводы в коде | Описание, список инструментов и изображения |
| WORK | `content.js` + `mosaic-layout.js` | Проекты, порядок, размеры и категории |
| Полные кейсы | `case-renderer.js` + `media-viewer.js` | Блоки кейсов и их оформление |
| CONTACTS | Разметка и обработчик копирования почты | Адреса, ссылки и доступные подписи |
| Навигация | `script.js`, `interaction.js` | Сохранить существующую механику |
| Восстановление позиции | `view-state.js`, `sessionStorage` | Сохранить и укрепить восстановление |

Горизонтальные переходы, вертикальные жесты на телефоне, раскрытие WORK и просмотр кейса уже реализованы. Переписывать их ради CMS не требуется.

В браузере проверено открытие WORK, галереи и полного кейса Organix. После обновления страницы этот кейс восстановился. **Точное восстановление произвольной глубины прокрутки и плавность на iPhone этим тестом не подтверждены** — это отдельные проверки следующего этапа.

**Обнаруженные проблемы**

1. **Прототип админки ломается при начальной загрузке.**  
   `renderAll()` обращается к элементу с ID `floating-add`, которого нет. В HTML кнопка имеет ID `addWorkBtn`. Ошибка подтверждена и кодом, и браузером.

2. **Сохранение прототипа ограничено браузером.**  
   Данные записываются в `localStorage`. Есть экспорт JSON, а `PUBLISH` отключён. Серверной загрузки файлов, входа и публикации нет.

3. **Предпросмотр мозаики не полностью соответствует сайту.**  
   В iframe вызывается общий рендерер, но настройки `galleryLayout` не передаются через ожидаемый им источник. Название «точная мозаика» сейчас не гарантирует одинаковый результат.

4. **Сетка молча корректирует часть параметров.**  
   Есть ограничения количества карточек на адаптивных ширинах, автоматическое перераспределение и принудительный `cover` в режиме заданных рядов. Это противоречит требованию предупреждать о конфликте настроек.

5. **В кейсе Organix есть ссылки на два отсутствующих в репозитории файла:** изображение и видео. Их нужно восстановить или согласованно заменить, а не скрывать проблему.

6. **Медиа распределены между GitHub и Dropbox.**  
   В текущем дереве репозитория около 255 МБ изображений и видео. Две обложки-видео подключены через Dropbox. Это нужно учесть при переносе, чтобы не потерять доступ к файлам.

7. **CSS накопил много последовательных правок.**  
   Один `viewport.css` занимает около 106 КБ. Поэтому массовую «очистку» стилей одновременно с CMS проводить нельзя: слишком легко изменить утверждённый внешний вид.

**Сопоставление функций**

В таблице «старое» означает найденную реализацию в исходниках, а не повторное тестирование старого production-интерфейса.

| Функция | Старая админка | Новый проект | Необходимая интеграция и ограничения |
|---|---|---|---|
| Создание, удаление, название и описание работы | Есть | Код прототипа есть, запуск нарушен | Перенести в серверный черновик; сохранять стабильные ID |
| Дублирование работы | Есть, включая блоки кейса | В прототипе нет | Сохранить функцию с новыми ID копий |
| Порядок работ | Перетаскивание и кнопки | Перетаскивание предусмотрено | Подключить к общей модели раскладки |
| Изменение размера за стороны и углы | Восемь ручек | Только ползунки ширины/высоты | Вернуть ручки и плавный предпросмотр |
| Пропорциональное и свободное масштабирование | Есть | Изменение размеров принудительно включает свободный режим | Явно разделить размер плитки и кадрирование медиа |
| Исходные пропорции | Отдельная команда | Нет полноценного аналога | Использовать сохранённые размеры оригинала |
| Масштаб и положение изображения внутри плитки | Есть | Только `cover/contain` | Перенести масштаб, фокус и сброс кадрирования |
| Форматы 1:1, 4:5, 16:9 | Есть | Нет | Сохранить как необязательные быстрые настройки |
| Ряды и число карточек | Есть частичная реализация | Рендерер есть, редактора нет | Добавить явное управление рядами |
| Занятие нескольких строк/колонок | Есть параметры и разные режимы | Поддержка в рендерере частичная | Единая модель span; конфликт — предупреждение, не молчаливая коррекция |
| Перенос карточки между рядами | Через перестановку и параметры | Только изменение общего порядка | Добавить видимые места вставки и проверку допустимости |
| Категории | Создание, переименование, удаление, назначение | Только назначение существующих | Вернуть управление категориями |
| Временное скрытие работы | Не найдено | Не найдено | Добавить статус видимости отдельно от удаления |
| Включение полного кейса | Есть | Флажок есть | Сохранить текущую логику открытия |
| Визуальный редактор кейсов | Есть | Есть публичный рендерер, редактора нет | Подключить редактор к тому же `CaseRenderer` |
| Изображения, видео, текст | Есть | Публичный показ поддерживается | Добавить создание и редактирование блоков |
| Свободный холст и вертикальная сборка | Есть оба режима | Рендерер поддерживает оба | Сохранить существующие кейсы без автоматической перекомпоновки |
| Перетаскивание, размеры, порядок и слои | Есть | В новом редакторе нет | Перенести инструменты с адаптацией к текущему рендереру |
| Дублирование и удаление блоков | Есть | Нет редактора | Перенести |
| Поворот медиа | Есть | Рендерер поддерживает | Вернуть управление углом |
| Ручное кадрирование и исходный формат | Есть | Рендерер поддерживает | Обрезка только по явному выбору |
| Линейки сверху/слева, направляющие | Есть | Нет редактора | Перенести направляющие; не выводить их публично |
| Shift, привязки, ALIGN, распределение | Есть | Нет редактора | Сохранить множественное выделение и команды |
| Текст прямо на странице | Есть | Рендерер умеет, интерфейса нет | Подключить редактирование без HTML/JSON |
| Шрифт, размер, вес, курсив, выравнивание | Есть | Частично поддерживает рендерер | Сохранить ограничения дизайн-системы |
| Цвет текста, межстрочный интервал, управляемые промежутки | Полноценного управления не найдено | Нет | Добавить поля модели и общий вывод |
| Отмена/повтор | Undo до 40 снимков; Redo не найден | Нет | Полноценные Undo/Redo для редакторских действий |
| Защита от потери правок | Предупреждение при уходе, контроль ревизии | Локальное сохранение | Серверный автосейв и обработка конфликтов устройств |
| Desktop/Tablet/Mobile preview | Есть | Переключатель есть | Общий рендерер и реальные адаптивные правила |
| Бренды | Добавление, удаление, загрузка, порядок | Название, URL, добавление/удаление | Вернуть загрузку и сортировку |
| INTRO / ABOUT / CONTACTS | Полноценного редактора не найдено | Контент преимущественно в коде | Добавить структурированные поля без изменения композиции |
| EN/RU | Данные есть; некоторые правки зеркалируются | Есть аналогичное зеркалирование | Не перезаписывать перевод автоматически |
| Большие загрузки | Части, прогресс, пауза, продолжение, отмена | Нет | Перенести серверный механизм и метаданные файлов |
| Черновик → предпросмотр → публикация | Сохранение сразу меняет сайт | Только локальный черновик | Новый серверный жизненный цикл публикаций |
| Версии и откат контента | История публикаций CMS не найдена | Нет | Неизменяемые опубликованные версии и восстановление |
| Вход, выход, смена пароля | Есть серверная реализация | Нет | Независимая от ChatGPT авторизация |
| Статистика | Визиты, работы, кейсы, география, маршруты, исключение владельца | Нет работающего серверного раздела | Сохранить как отдельный раздел; география приблизительная |

**Предлагаемая архитектура**

Оставить **тот же репозиторий и существующий публичный интерфейс**. Добавить в него серверную часть CMS и полноценную `/admin`.

GitHub Pages обслуживает статические файлы и сам по себе не даёт серверной авторизации, базы и API загрузки. Поэтому для требований из задания необходим backend. [GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site?ref=the-contrarian\&utm_source=chatgpt.com)

Предлагаю следующую схему:

- **Публичный сайт:** существующие HTML/CSS/JS и анимации.
- **Админка:** визуальные редакторы с теми же рендерерами мозаики и кейсов.
- **API:** вход, черновики, предпросмотр, публикация, версии, загрузки.
- **База:** контент, ревизии, настройки, сессии и метаданные медиа.
- **Объектное хранилище:** оригиналы изображений и видео, обложки и отдельные оптимизированные варианты.

Cloudflare Workers + D1 + R2 — подходящий кандидат, поскольку старый сервер уже использует аналогичные механизмы. Но **окончательный выбор зависит от доступного аккаунта, стоимости и проверки доставки медиа твоей аудитории**. Подключать сервис или менять маршрутизацию без согласования нельзя.

Если подтверждённой инфраструктуры Cloudflare нет, сначала выбираем backend и S3-совместимое хранилище. Публичный сайт при этом не требуется переносить с GitHub Pages. Способ подключения `/admin` и API нужно согласовать с фактической инфраструктурой.

**Как должны сохраняться и публиковаться изменения**

- Черновик сохраняется на сервере и доступен с другого устройства.
- Предпросмотр читает именно черновик, публичный сайт — только опубликованную версию.
- Публикация проверяет раскладку, ссылки на медиа и структуру кейсов.
- Переключение опубликованной версии происходит целиком: посетитель не видит половину старого и половину нового контента.
- Откат переключает контент на выбранную предыдущую версию.
- Изменения с двух устройств не перезаписывают друг друга молча.
- Файлы, используемые предыдущими версиями, не удаляются при обычном удалении карточки.
- Неопубликованные медиа не должны становиться общедоступными только из-за загрузки.

Обновление контента не должно пересоздавать галерею во время открытого кейса или анимации. Стабильные ID позволят сохранить фильтр, карточку-якорь и позицию прокрутки.

**Как исправить управление мозаикой**

Существующий внешний вид нужно зафиксировать как исходную раскладку. Новые настройки не должны автоматически менять её.

Для редактора нужны явные ряды, размеры карточек и занятые ячейки. При перетаскивании показывается будущий результат; остальные карточки перемещаются только в допустимые свободные места.

Произвольное число карточек в каждом ряду, исходные пропорции, фиксированные размеры и полное отсутствие пустот **не всегда совместимы одновременно**. В таких случаях редактор должен предложить конкретный выбор: изменить высоту ряда, ширину соседней плитки, перенести карточку или разрешить кадрирование. Самостоятельно выбирать за тебя он не должен.

Мобильная раскладка должна быть отдельным явно обозначенным адаптивным представлением, а не скрытым изменением сохранённой десктопной композиции.

**Медиа и ограничения**

Старый загрузчик уже умеет продолжать загрузку частями, но его собственный предел 625 ГиБ нельзя выдавать за проверенную возможность новой системы.

R2 поддерживает multipart-загрузки; при загрузке через Worker нужно учитывать также ограничения размера отдельного запроса. Это позволяет убрать искусственные 25 МБ без обещания «безлимитного файла». [Cloudflare R2 docs](https://developers.cloudflare.com/r2/api/workers/workers-multipart-usage/?utm_source=chatgpt.com)

Оригинал необходимо сохранять неизменным. Оптимизированные изображения, постеры и видео — отдельные производные файлы; настройки сжатия видео согласуются с тобой. Для перемотки нужны корректные Range-ответы, а для воспроизведения — поддерживаемый браузером кодек.

Dropbox не предлагаю делать основным медиахранилищем CMS: публичные ссылки зависят от ограничений общего доступа и трафика. Уже используемые ссылки нельзя отключать до проверки замены. [Dropbox Help](https://help.dropbox.com/share/banned-links?utm_source=chatgpt.com)

**План реализации после согласования**

1. **Зафиксировать исходное состояние.**  
   Создать рабочую ветку от актуальной `main`, сохранить снимок контента и перечень медиа. Подготовить изолированные тестовые базу и хранилище, способ отката. Снять эталонные виды и переходы desktop/mobile.

2. **Утвердить инфраструктуру и модель данных.**  
   Определить размещение API, базы и медиа. Зафиксировать форматы проектов, рядов, блоков кейса, переводов и версий. Проверить сохранность существующих 35 работ.

3. **Добавить серверную основу.**  
   Вход по логину и паролю, серверная проверка прав, защищённые сессии, ограничение попыток входа, проверка запросов и файлов. Первичная настройка владельца — без зависимости от заголовков авторизации Sites.

4. **Реализовать сохранение и публикацию.**  
   Черновики, автосейв, предпросмотр, контроль конфликтов, публикации и откат. Подключить публичный сайт через небольшой адаптер данных.

5. **Подключить медиа.**  
   Загрузка частями, прогресс, продолжение, отмена, обложки, размеры оригиналов, Range-запросы. Восстановить отсутствующие файлы Organix перед переносом кейса.

6. **Завершить редактор WORK.**  
   Исправить запуск прототипа, вернуть возможности старой админки, добавить управление рядами и span, скрытие проектов и предупреждения о конфликтах.

7. **Завершить редактор кейсов.**  
   Общий публичный рендерер, свободный холст и блочная сборка, кадрирование, поворот, линейки, ALIGN, типографика, Undo/Redo.

8. **Подключить остальные разделы.**  
   Бренды, категории, INTRO, ABOUT, CONTACTS, переводы и статистика — без декоративных изменений.

9. **Проверить реальные сценарии на тестовой версии.**  
   Сохранение с другого устройства; черновик без изменения production; публикация и откат; большие загрузки после обрыва; перестановка и растягивание карточек; редактирование кейсов; обновление внутри кейса; возврат на прежнюю позицию; мобильные жесты и анимации.

10. **Предоставить тестовую ссылку и результаты.**  
    Обновление `panxrt.win` — только после твоего отдельного разрешения.

Полноценные проверки записи, загрузки, публикации и отката сейчас не выполнялись: серверной CMS в новом проекте ещё нет, а этап разрешён только для аудита.

**На этом останавливаюсь.** Следующий шаг — согласовать этот план и размещение backend/медиа. До подтверждения разработку и изменения production не начинаю.

---

# Приложение B. Второй отчёт WORK (GitHub-first) — полный оригинальный текст

**Да, нужную админку можно сделать преимущественно через GitHub, оставив сайт на GitHub Pages. Для твоих условий рекомендую именно этот вариант.**

Мой предыдущий вариант с базой данных и R2 не обязателен: для проектов, текстов, настроек и истории достаточно Git. Небольшая серверная функция потребуется для безопасного входа и записи в репозиторий. Публичный сайт не будет обращаться к ней при просмотре.

**Ничего не изменял: ни код, ни ветки, ни DNS, ни ссылки на медиа.**

**Актуальное состояние**

Перепроверил [репозиторий Panxrt/Panxrt.github.io](https://github.com/Panxrt/Panxrt.github.io), опубликованные файлы и прототип:

- `main` по-прежнему на коммите `db4e6864…` от 7 октября; развёртывание GitHub Pages успешно.
- Сайт и прототип отвечают HTTP 200.
- В `content.json`: 35 работ, 8 брендов, 4 категории, ревизия 119.
- Ошибка обращения к отсутствующему `floating-add` осталась.
- Прототип сохраняет данные в браузере; публикация не реализована.
- Ссылки Fava и Motion Showreel по-прежнему ведут на Dropbox.

Исходники старой админки доступны как основа редакторов. Её авторизованный рабочий интерфейс повторно не тестировался.

**Сравнение архитектур**

| Критерий | A — GitHub-first, рекомендую | B — GitHub + полноценный backend и хранилище |
|---|---|---|
| Контент | JSON и версии в Git | База для редактирования; опубликованный снимок экспортируется в Git |
| Дополнительные компоненты | Небольшой сервис входа и записи | API, база, медиахранилище, синхронизация |
| Публичный сайт | Остаётся на GitHub Pages | Тоже можно оставить на GitHub Pages |
| Черновики | Ветки; для конфиденциальных нужен приватный вариант | Приватные записи в базе |
| Публикация | Проверка → коммит → сборка Pages | Проверка → экспорт → коммит → сборка Pages |
| История и откат | Git | История базы плюс Git |
| Безопасность | GitHub App с доступом к одному репозиторию | Та же авторизация плюс защита базы и файлов |
| Стоимость | Возможны **$0 дополнительных расходов** в пределах бесплатных лимитов | Возможен бесплатный старт; хранилище может выставлять счёт |
| Масштабирование | Сотни проектов допустимы; тяжёлые медиа выносятся наружу | Удобнее для большого объёма медиа и частого редактирования |
| Доступность в РФ | Существующий маршрут сайта сохраняется | Зависит от того, какие файлы вынесены на новый сервис |
| Совместимость со старой админкой | Визуальные инструменты переиспользуются, сохранение заменяется | Серверная часть старой системы ближе по устройству |
| Сложность сопровождения | Ниже | Выше: нужно согласовывать состояния Git, базы и хранилища |

Вариант B сейчас добавит компоненты, необходимость которых ещё не доказана. **Начинаем с A, оставляя возможность подключить другое медиахранилище позднее.**

**1. Как будет организован вход**

Предлагаю **«Войти через GitHub» через отдельное GitHub App**:

1. Ты входишь на стороне GitHub; админка не получает твой пароль.
2. Серверная функция проверяет пользователя и разрешает управление только твоему аккаунту.
3. Приложение установлено только для `Panxrt/Panxrt.github.io`.
4. Разрешения: запись контента и работа с PR; чтение статуса сборки. Доступ к настройкам аккаунта и другим репозиториям не нужен.
5. Секреты остаются на сервере. В браузере — защищённая сессия, без GitHub-токена в `localStorage`.
6. Сервер разрешает CMS менять только согласованные файлы контента. У GitHub разрешения шире, поэтому ограничение путей дополнительно обеспечивается нашим API.

Для входа используются `state` и PKCE. Документация GitHub предусматривает серверный обмен кода авторизации с использованием секрета приложения; публиковать этот секрет в JavaScript нельзя. [GitHub Docs](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app?utm_source=chatgpt.com)

**Подключение GitHub к ChatGPT не станет авторизацией админки.** У неё будет собственный доступ, и пользоваться ею можно будет независимо от ChatGPT.

Для размещения функции есть два бесплатных кандидата:

| Сервис | Бесплатные условия | Оценка |
|---|---|---|
| Cloudflare Workers Free | 100 000 запросов в сутки, 10 мс CPU на вызов; начать можно без карты | Предпочтительный кандидат для небольшого API; нужно проверить выполнение в лимитах |
| Netlify Free | 300 кредитов в месяц, жёсткий бесплатный предел | Запасной вариант; кредиты расходуются также на вычисления, запросы и развёртывания |

Workers использовать **только для редактора и его API**, на отдельном адресе, без изменения DNS `panxrt.win`. Окончательно выбрать площадку нужно после проверки доступа к ней с твоей стороны. [Cloudflare Workers docs](https://developers.cloudflare.com/workers/platform/pricing/?utm_source=chatgpt.com)

**2. Как изменения попадут в GitHub**

Редактор будет работать с существующей моделью `content.json` и совместимыми расширениями.

При сохранении сервер:

- проверяет структуру данных и права;
- сравнивает исходную версию с текущей;
- формирует один коммит со всем набором изменений;
- обновляет ветку без принудительной перезаписи.

Если с другого устройства уже внесены правки, редактор покажет конфликт. Он не затрёт чужую версию и не предложит просто потерять свои изменения. GitHub API поддерживает обновление ссылок без `force`, защищающее от перезаписи расходящейся истории. [GitHub Docs](https://docs.github.com/en/rest/git/refs?utm_source=chatgpt.com)

Каждое движение мыши не будет создавать коммит. Правки группируются; локальное аварийное сохранение дополняет сохранённый в Git черновик.

**3. Черновики, публикация и восстановление**

| Действие | Поведение |
|---|---|
| **SAVE DRAFT** | Сохранить изменения в ветке черновика, не меняя опубликованный сайт |
| **PREVIEW** | Открыть текущую версию черновика через те же рендереры и стили |
| **PUBLISH** | Проверить изменения, включить их в публикационную ветку через контролируемый процесс и дождаться Pages |
| **RESTORE** | Создать новую публикацию с контентом выбранной старой версии |

При восстановлении **не откатываем весь репозиторий**: новые исправления кода должны сохраниться. Восстанавливаются данные контента и ссылки на соответствующие медиа.

Статус публикации будет честным: «сохранено в Git» → «сборка» → «развёртывание» → «проверена опубликованная версия». Коммит сам по себе ещё не означает, что посетители увидели результат.

Есть принципиальное ограничение: **ветка публичного репозитория не является приватным черновиком**. Она скрыта от главной страницы сайта, но её содержимое можно прочитать через GitHub.

Поэтому:

- для неконфиденциальных материалов подходят ветки текущего репозитория;
- для материалов под NDA потребуется приватное хранилище: например, отдельный приватный репозиторий контента либо небольшая приватная база;
- закрытый предпросмотр не скрывает файлы, уже записанные в публичный Git.

Приватные репозитории доступны на GitHub Free, но дополнительный репозиторий я не создам без согласования. Это был бы только склад черновиков, а не новый сайт. [GitHub Docs](https://docs.github.com/en/get-started/learning-about-github/githubs-plans?utm_source=chatgpt.com)

**4. Изображения, видео и Dropbox**

**Оба существующих видео оставляем на своих адресах.** Предыдущее замечание о Dropbox касалось масштабирования, а не необходимости удалить работающие ссылки.

Результат новой проверки:

- **Motion Showreel:** получен `video/mp4`, HTTP 206 и поддержка Range-запросов; размер примерно 41,7 МБ.
- **Fava:** из этой среды получена HTML-страница входа Dropbox. Поэтому сейчас я не могу подтвердить анонимную прямую отдачу этого файла. Это не доказательство, что видео перестало работать у тебя; ссылку не меняю.

Админке нужен универсальный слой медиа:

| Источник | Что сможет редактор |
|---|---|
| Файлы репозитория | Загружать небольшие ресурсы, учитывать их размер |
| Внешняя ссылка | Подключать изображение/видео, проверять загрузку и показывать предпросмотр |
| Dropbox | Сохранять существующие ссылки; после отдельного подключения — загружать новые файлы |
| Будущее объектное хранилище | Использовать тот же интерфейс без переделки кейсов |

Метаданные — размеры, пропорции, постер, кадрирование, источник — хранятся отдельно от адреса файла.

**Загрузка прямо из админки в Dropbox реализуема**, но потребует отдельного OAuth-разрешения Dropbox. Для новых файлов можно ограничить доступ папкой приложения, не открывая редактору весь аккаунт. Большие файлы загружаются сессиями по частям. Оригиналы не пережимаются автоматически. [Dropbox API Documentation](https://developers.dropbox.com/oauth-guide?utm_source=chatgpt.com)

Проверка ссылки будет различать «файл недоступен», «нужен вход» и «проверка ограничена CORS». Невозможность прочитать заголовки из браузера не должна автоматически превращаться в сообщение «ссылка сломана».

**5. Реальные бесплатные ограничения**

| Компонент | Бесплатный предел | Что это означает |
|---|---|---|
| GitHub Pages | Опубликованный сайт до 1 ГБ; мягкий предел трафика 100 ГБ/месяц | Внешние видео не занимают размер сборки |
| Dropbox Basic | Базово 2 ГБ места | Фактически свободное место аккаунта ещё не проверено |
| Публичные ссылки Dropbox Basic | 20 ГБ трафика и до 100 000 скачиваний в сутки | Видео может исчерпать трафик раньше количества скачиваний |
| Workers Free | 100 000 запросов/сутки | Для личного редактора выглядит достаточным; требуется проверка CPU |
| D1 Free, если понадобится | 5 ГБ суммарно, 5 млн прочитанных и 100 тыс. записанных строк/сутки | Возможный вариант для приватных черновиков или статистики |

Лимиты подтверждены документацией сервисов. [GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits?utm_source=chatgpt.com)

Например, 20 ГБ — это приблизительно **400 полных передач видео по 50 МБ в сутки**. Это не число посетителей: загрузка частями, повторные просмотры и другие файлы меняют расход.

Для роста портфолио:

- в Git остаются данные, код и небольшие ресурсы;
- тяжёлые оригиналы хранятся снаружи;
- редактор показывает размер сборки и предупреждает заранее;
- замена файла создаёт новый адрес, чтобы старые публикации можно было восстановить;
- удаление карточки не удаляет медиа автоматически;
- учитывается и история Git: обычное удаление файла не убирает его прошлые версии.

Git LFS для Pages не предлагаю: GitHub прямо указывает, что он не используется с GitHub Pages. [GitHub Docs](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage?utm_source=chatgpt.com)

**6. Когда появятся расходы**

Для варианта A целевой бюджет — **$0 в месяц / $0 в год дополнительных платежей за сервисы**, пока хватает бесплатных лимитов. Продление уже купленного домена оплачивается отдельно по тарифу регистратора; его цену я не проверял.

Возможные будущие расходы:

| Вариант | Условия |
|---|---|
| Дополнительное место Dropbox | Платный тариф только при необходимости и после согласования |
| R2 Standard | Бесплатно 10 ГБ-месяцев и определённое число операций; дальше оплата по использованию |
| Workers Paid | От $5/месяц, но сейчас подключать не предлагаю |
| Обработка видео | Не включена в бесплатную CMS автоматически; отдельное решение при необходимости |

R2 — **не безусловно бесплатное хранилище**: подключается через оформление подписки, после бесплатного объёма возможны начисления. Для примера, постоянные 50 ГБ при операциях в бесплатном лимите дали бы около **$0,60/месяц за хранение**, или $7,20/год; это не гарантия полного счёта. Сейчас R2 не нужен. [Cloudflare R2 docs](https://developers.cloudflare.com/r2/get-started/?utm_source=chatgpt.com)

Из других бесплатных хранилищ проверил Supabase: 1 ГБ файлов и максимум 50 МБ на файл на Free — для твоих крупных видео это слабая замена Dropbox. [Supabase](https://supabase.com/pricing?utm_source=chatgpt.com)

**7. Статистика — отдельное исключение**

Посещения нельзя разумно записывать коммитами в Git. Для сохранения всех старых графиков, событий, маршрутов и географии потребуется отдельный приёмник событий и хранилище.

Бесплатный кандидат — Worker + D1 с ограничением срока хранения. Он подключается отдельно после согласования. Если аналитика недоступна, сайт продолжает работать.

Исключение твоих посещений потребуется настроить на каждом устройстве. География останется приблизительной; VPN и блокировщики влияют на данные.

**8. Как сохранить редакторы и внешний вид**

Предлагаемый стек:

- существующие HTML/CSS/JavaScript;
- текущие `mosaic-layout.js` и `case-renderer.js`;
- инструменты старой админки, адаптированные к текущей модели;
- небольшой TypeScript API для GitHub App;
- GitHub как хранилище контента и версий;
- адаптеры медиа для GitHub, Dropbox и внешних ссылок.

Сохраняются восемь ручек resize, пропорциональный и свободный режимы, фокус и кадрирование, ряды и span, оба режима кейсов, поворот, линейки, направляющие, Shift, ALIGN, слои. Добавляются отсутствующие полноценные Redo, цвет, межстрочный интервал и управление масштабом просмотра.

**Текущие композиции остаются на старом совместимом режиме раскладки**, пока ты сам не начнёшь менять их новыми инструментами. Это безопаснее автоматической конвертации всех работ.

EN/RU редактируются независимо. Публичные анимации и CSS массово не переписываются.

**9. Основные риски**

| Риск | Как учитывать |
|---|---|
| Черновик доступен через публичную ветку | Явный выбор публичного или приватного хранения |
| Две вкладки сохраняют разные правки | Контроль исходного коммита, конфликт вместо перезаписи |
| GitHub ограничивает частые запросы | Группировка сохранений, очередь и повтор с задержкой |
| Публикация Pages занимает время | Реальные статусы и проверка результата |
| Произвольные размеры не укладываются без дыр | Предпросмотр конфликта и выбор корректировки пользователем |
| Dropbox возвращает страницу вместо файла | Проверка типа ответа и воспроизведения; сохранение прежней ссылки до согласованной замены |
| Откат JSON ссылается на удалённое медиа | Сохранение используемых файлов и неизменяемые адреса |
| Сотни видео перегружают телефон | Постеры, ленивая загрузка, остановка невидимых видео |
| Новый сервис не открывается в РФ | Отдельная проверка; публичный сайт не зависит от API редактора |

У GitHub API есть дополнительные ограничения на частоту операций записи, поэтому серверный автосейв нельзя делать на каждом пикселе перетаскивания. [GitHub Docs](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?utm_source=chatgpt.com)

**Доступность из РФ я сейчас не подтвердил независимой проверкой из российских сетей.** Твоя проверка действующего сайта учитывается. Новые адреса редактора и медиа нужно отдельно проверить с мобильного и домашнего интернета без VPN; успешный запрос из моей среды этого не заменяет.

**10. Этапы, сроки и проверка без production**

Оценка — **примерно 3–6 недель полноценной разработки и проверки**, не обещание готовности за несколько сообщений. Точнее можно оценить после работающего вертикального сценария «вход → черновик → тестовая публикация → восстановление».

| Этап | Результат | Ориентир |
|---|---|---|
| 1. Согласование и подготовка | Авторизация, приватность черновиков, тестовая среда, резервные копии | 1–2 рабочих дня |
| 2. Git-сохранение | Вход, SAVE DRAFT, PREVIEW, PUBLISH, RESTORE, конфликты | 3–5 дней |
| 3. WORK | Перетаскивание, восемь ручек, ряды, span, кадрирование | 3–5 дней |
| 4. Кейсы | WYSIWYG, направляющие, ALIGN, поворот, типографика, Undo/Redo | 4–6 дней |
| 5. Медиа и остальные разделы | Загрузки, бренды, тексты, языки; согласованная статистика | 2–4 дня |
| 6. Проверка и исправления | Устройства, сохранение, сбои, видео, анимации | 3–5 дней |
| 7. Публикация | Только после отдельного разрешения | По результатам проверки |

Изоляция тестирования:

- рабочая ветка от актуальной `main`, не от `dev-admin`;
- редактор и предпросмотр на отдельном тестовом адресе;
- запрет тестов на запись в `main`;
- проверка публикации в тестовую ветку и тестовый адрес;
- данные production используются как исходный снимок;
- новые тестовые медиа получают отдельные адреса;
- сравнение desktop/mobile с зафиксированной исходной версией.

Важный нюанс: **у GitHub Pages нет автоматически отдельного предпросмотра каждой ветки**. Для тестовой ссылки используем изолированное размещение редактора и предпросмотра из того же репозитория. Настройки основного Pages не переключаем.

Проверки включат повторное открытие с другого устройства, обрыв загрузки, конфликт сохранения, неудачную публикацию, восстановление версии, воспроизведение Dropbox-видео, обновление внутри кейса и возврат на прежнюю позицию галереи.

**Мой выбор: вариант A — GitHub-first, GitHub App, небольшой бесплатный сервис только для админки, существующий Dropbox и универсальные медиа-ссылки. Без обязательной базы и R2 на старте.**

Перед разработкой нужно согласовать этот вариант и один существенный вопрос: **допустимы ли доступные через GitHub черновики, или они обязательно должны быть конфиденциальными?** До твоего подтверждения ничего не меняю.

## Setup checkpoint — 2026-10-11 (supersedes Oct 10 sign-in blocker)

Completed and verified:
- Browser signed in as Panxrt; GitHub sudo email verification completed by owner.
- Created PRIVATE repository Panxrt/panxrt-cms-private (repository ID 1414029862).
- Seeded content.json unchanged from public main. Private seed commit: 74ca3bbac74c8075379de04876dd69bdb82ecb22.
- Created private cms-test-published branch at that seed commit. This is storage initialization, NOT a successful CMS publication test.
- Registered GitHub App PANXRT CMS Private (slug panxrt-cms-private), App ID 5271260, non-secret Client ID Iv23liGqfaWatuLY1X9A.
- App permissions: repository Contents read/write, mandatory Metadata read-only; all other permissions none. Only this account; webhook disabled; wildcard callback disabled; expiring user tokens enabled.
- Temporary callback: http://localhost:8787/auth/callback. Homepage https://panxrt.win.
- Installation form prepared: ONLY Panxrt/panxrt-cms-private selected, not public code repository. Install has NOT been clicked. Browser action-time confirmation is required before granting persistent private repository access.
- No client secret or private key generated. GitHub registration displayed a private-key prerequisite notice, but installation permissions form was reachable; verify whether final installation actually requires a key. Do not claim a key is universally unnecessary for GitHub registration.
- No production/main/DNS/media changes; no hosting deployed or paid services connected.

Next:
1. Obtain action-time confirmation and install App only on selected private repository; verify resulting installation scope.
2. Securely provision client secret directly into approved server secret storage (never chat, Git, client code). Current backend uses user-to-server OAuth, not installation JWT.
3. Before remote hosting: propose a verified free option and obtain owner consent; adapt runtime/session storage as needed. Local callback currently does not constitute a reachable deployed CMS.
4. Configure final origin/callback, then test REAL owner login, private draft save/reload, preview, concurrent-save conflict, restore, and test publication through CMS.
5. Record real results; previous 9 tests remain mock/local tests and must not be described as live end-to-end validation.

Browser sign-in and connector access are independent from CMS OAuth; creating repo via connector does NOT verify CMS login. No repeat audit needed.


## Installation verified — 2026-10-11 09:18 Europe/Belgrade

- Owner explicitly confirmed installation at action time.
- Installed PANXRT CMS Private successfully on Panxrt; GitHub success alert verified.
- Installation ID: 170184432. Settings: https://github.com/settings/installations/170184432
- Verified Only select repositories, exactly ONE repository: Panxrt/panxrt-cms-private.
- Permissions verified: Metadata read, Contents/code read and write. Public code repo NOT selected for write access. GitHub notes public repositories retain standard read-only availability.
- Installation succeeded without generating a private key, despite the earlier registration notice.
- Client secret not generated. Live CMS OAuth/save/preview/test-publication remain untested.
- No production, public main, DNS, media, or hosting changes.

Next blocking decision: owner consent for FREE isolated server hosting, explicitly required by user before deployment.
Proposed Render Free Node web service on an onrender.com address, built only from feature/admin-cms-20261010, no custom domain/DNS or production deploy. Prefer public repo URL deployment without granting Render access to private repository; CMS runtime uses its existing restricted App. Git-backed content persists; memory sessions expire on process restart. No payment method or paid add-ons; if card required or charges cannot be excluded, stop.
Verified official docs 2026-10-11: https://render.com/docs/free and https://render.com/docs/faq. Free service sleeps after 15 min idle, cold start about 1 minute, 750 instance-hours/month. No payment method: exceeding chargeable allowances suspends service instead of charging. This is a test-environment proposal, not an always-on production recommendation. Regional accessibility not yet tested.
Before deploy adapt listen host from loopback to 0.0.0.0, confirm PORT and Node >=22, HTTPS proxy/origin/cookie settings; store secret only in server environment, not Git/chat/client. Replace local callback with exact approved HTTPS service callback. Then run live acceptance tests and update this handoff.


## Render preparation — 2026-10-11 afternoon

Owner approved Render Free without card/paid services. Implemented explicit CMS_BIND_HOST=0.0.0.0 for managed TLS reverse proxy; default remains loopback; external binding rejects HTTP CMS_ORIGIN. Existing host/CSRF/auth guards retained. Updated cms/SETUP.md with concrete service configuration.
Verified: all 9 local automated tests passed after change. These are not live OAuth tests.
Blocked on Render sign-in (dashboard.render.com/login). No service created or deployed yet, no client secret generated. Continue from Render login, create Free service from feature/admin-cms-20261010 only, then configure secret/callback and perform live acceptance tests. Existing GitHub App installation already verified; do not recreate repository or App.


### Render login checkpoint
Owner chose Google in secure browserAuth. Google OAuth destination returned 502 Bad Gateway / connection refused in cloud browser. Fresh Render dashboard verification still shows login, so no authenticated Render session or service exists. This is a network failure, not evidence of bot detection. Do not repeat credentials or assume successful login. Offer user manual Render sign-in/registration in the cloud browser; do not silently switch identity provider. Runtime change and setup instructions are committed (b01b955, 3d3d6bc); 9 local tests passed. Next: authenticated Render dashboard -> Free Web Service from working branch -> secret and callback setup -> live tests.


## Render service created — 2026-10-11 14:58 CEST
- Render account verified. Created FREE Node service panxrt-cms-test, ID srv-db5of9nlot8c73flnk6g.
- URL: https://panxrt-cms-test.onrender.com; admin /admin/.
- Source public Git URL, branch feature/admin-cms-20261010, commit 13f67e7. No Render GitHub App/repository permissions granted.
- Free $0, no card, auto-deploy OFF, no DNS/custom domain changes.
- Render autogenerated project "My project" and environment named "Production": this label refers ONLY to new isolated Render test service, not live portfolio production.
- Build: node --test cms/test/*.test.mjs -> 9 passed in Render build.
- Start: CMS_ORIGIN="$RENDER_EXTERNAL_URL" node cms/server.mjs; log confirms server started with correct HTTPS origin; health path /api/session.
- Env: CMS_BIND_HOST=0.0.0.0; CMS_PRIVATE_REPO=Panxrt/panxrt-cms-private; nonsecret GITHUB_CLIENT_ID; NODE_VERSION=22; SKIP_INSTALL_DEPS=true.
- GITHUB_CLIENT_SECRET not configured, so CMS OAuth remains closed. GitHub App callback remains localhost until updated.
- GitHub settings requires renewed sudo email verification (email triggered). Next verify access, replace callback with https://panxrt-cms-test.onrender.com/auth/callback, provision client secret directly via owner into Render environment (no chat/Git), then live OAuth/save/preview/test-publication checks.
