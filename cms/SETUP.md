# PANXRT CMS: подключение приватного тестового контура

## Что уже есть и чего пока нет

Ветка содержит исполняемый Node.js API (без сторонних зависимостей) и перенесённые редакторы старой админки. Он НЕ развёрнут в интернете. Главный сайт и настройки Pages не менялись. Новый адрес `/admin/` существует на тестовом сервере, а не на panxrt.win. GitHub App, приватное хранилище и хостинг ещё не созданы.

Реальные авторизация/запись требуют действий владельца ниже. Нельзя считать проверки с mock GitHub проверкой настоящего OAuth или реального развёртывания. Node-сервер является переносимым тестовым адаптером; перед бесплатным размещением на Worker/другом сервисе нужен соответствующий HTTP/session adapter. Сервис/аккаунт/тариф не подключать автоматически.

## 1. Создать приватное хранилище (владелец)

1. GitHub → `+` → New repository.
2. Owner: `Panxrt`, имя: `panxrt-cms-private`, **Private**, Add README → Create repository.
3. Add file → Upload files: загрузить неизменённый `content.json` из текущей main `Panxrt/Panxrt.github.io`. Commit в main **приватного** репозитория.
4. В селекторе ветки ввести `cms-test-published` → Create branch from main. Это TEST-снимок контента, не Pages.
5. Проверить значок Private. Не включать Pages и не делать этот репозиторий публичным. Репозиторий содержит ссылки, а не копии исходных медиа. Сами публичные URL медиа остаются публичными.

API на каждом чтении/записи проверяет `private:true`. `Panxrt/Panxrt.github.io` как хранилище отклоняется независимо от настроек. Создание новых проектов/черновиков в публичной рабочей ветке запрещено. В рабочей ветке хранится только код и документация.

## 2. Создать GitHub App (владелец)

GitHub → Settings → Developer settings → GitHub Apps → New GitHub App.

- Name: свободное имя, например `PANXRT CMS Private`.
- Homepage URL: `https://panxrt.win`.
- Callback URL для локальной проверки: `http://localhost:8787/auth/callback`.
- Webhook: снять Active (пока не используется).
- Repository permissions: **Contents: Read and write**, Metadata: read-only автоматически. Другие права не запрашивать.
- Where can this GitHub App be installed: **Only on this account**.
- Create GitHub App → Generate a new client secret.
- Install App → Only select repositories → **только `panxrt-cms-private`**. Публичный сайт не выбирать.

Client ID и Client secret вводятся только в локальные переменные окружения/хранилище секретов будущего сервера. НЕ отправлять secret в чат, не коммитить `.env`, не помещать токены в браузер. Приватный ключ GitHub App для этого первого user-to-server flow не требуется.

Авторизация допускает только GitHub user ID `156057823`. Сессия хранится в памяти сервера, токен не выходит в браузер. OAuth использует state + PKCE + cookie binding; запись требует Origin и CSRF. Сеанс живёт до часа; при перезапуске нужно войти повторно. Распределённое серверное хранение сессий/refresh — дальнейший этап перед удалённым размещением.

## 3. Запуск на компьютере разработчика

Node.js >=22. Из корня checkout:

```bash
export CMS_PRIVATE_REPO=Panxrt/panxrt-cms-private
export CMS_ORIGIN=http://localhost:8787
export GITHUB_CLIENT_ID='значение из GitHub App'
read -rsp 'GitHub App client secret: ' GITHUB_CLIENT_SECRET
export GITHUB_CLIENT_SECRET
node cms/server.mjs
```

Открыть `http://localhost:8787/admin/` → Войти через GitHub. Пароль вводится только на github.com. Для последующего размещения origin должен быть HTTPS, callback изменяется на точный новый адрес. Не менять DNS panxrt.win. Сервер слушает loopback; наружный TLS reverse proxy/managed adapter настраивать отдельным этапом.

## 4. Проверка с реальными GitHub операциями

1. Открыть карточку, изменить тестовое название, SAVE → новый коммит в приватной main.
2. Открыть второе устройство/сеанс: увидеть сохранённый документ (для другого устройства нужен отдельно размещённый HTTPS API).
3. Предпросмотр сайта → `/preview/`: те же публичные JS/CSS; JSON приватный. Просмотр требует авторизации. Не выводить черновики через Pages.
4. В двух вкладках сохранить несовпадающие версии: вторая должна получить конфликт, не потерять форму. Скачать копию перед загрузкой удалённой версии.
5. Опубликовать в TEST → коммит ТОЛЬКО в `cms-test-published` приватного репозитория; `/test-preview/` показывает его. Это **не реальный Pages deployment**: UI/API не должны говорить, что production опубликован.
6. Версии → восстановить старую: новый коммит контента, код/медиа не откатываются.
7. Проверить выход, истечение сессии, неавторизованный просмотр, GitHub ошибки.

Автоматические проверки: `node --test cms/test/*.test.mjs`.

## Что продолжить после подключения

- Проверить настоящие OAuth, private Git read/write и preview; выбрать/согласовать бесплатное размещение и session adapter.
- Пройти визуальную QA перенесённых редакторов. В текущей среде browser QA недоступна.
- Завершить явные ряды (добавление/удаление/перенос, spans, UI конфликтов). Не конвертировать текущую раскладку без действия владельца.
- Довести общее отображение typography/visibility/секций до публикации. Сейчас некоторые новые опции редактора ещё не подключены к public renderer.
- Подключить отдельно разрешённые загрузки (Dropbox OAuth, progress/resume), без качества/транскодирования по умолчанию. Сейчас только ссылки; кнопка загрузки честно сообщает о неподключённом адаптере.
- Статистика пока не подключена. Существующие медиа, Dropbox URL, DNS и public main не менять.
- Production publish/Pages verification не реализовывать как обход TEST-only ограничений. Это отдельный согласуемый этап с проверкой deploy и откатом только контента.

GitHub App docs: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app


## Render Free — согласовано 2026-10-11

Приватный репозиторий и App уже созданы; App установлен только на приватный репозиторий (installation 170184432). Верхние шаги 1–2 сохранены как справка, повторять их не нужно.

Изолированный Web Service:
- Source: public repository URL https://github.com/Panxrt/Panxrt.github.io
- Branch: feature/admin-cms-20261010 (никогда main)
- Runtime: Node, Node >=22; Free; без карты и платных дополнений
- Root directory: корень репозитория (не cms)
- Build command: node --test cms/test/*.test.mjs
- Start command: node cms/server.mjs
- Environment: CMS_BIND_HOST=0.0.0.0, CMS_PRIVATE_REPO=Panxrt/panxrt-cms-private
- CMS_ORIGIN: точный HTTPS адрес созданного сервиса, без завершающего слеша
- GITHUB_CLIENT_ID: из существующего PANXRT CMS Private
- GITHUB_CLIENT_SECRET: только защищённая переменная сервера, ввод владельцем; не чат/коммит.
- PORT: переменная платформы.
- Callback App: CMS_ORIGIN + /auth/callback.
- Один экземпляр сервера. Сессии в памяти: после сна/перезапуска повторный вход; Git-черновики сохраняются.
- Проверка здоровья: /api/session (не читать/отдавать черновики без сессии).
- Auto deploy отключить; публикация только ручная в тестовом сервисе.
- DNS, production, media не изменять.

На момент записи сервис не создан: браузер показывает вход Render. После входа продолжить настройку, затем реальные OAuth/save/preview/publish-test проверки.


## Private Dropbox uploads (implemented 2026-10-14; connection pending)

The test CMS now has a server-side Dropbox App-folder adapter and chunked upload panel.
It is **disabled until all four environment variables are configured**:

- `DROPBOX_CLIENT_ID` — Dropbox App key.
- `DROPBOX_CLIENT_SECRET` — secret, server environment only.
- `DROPBOX_REFRESH_TOKEN` — offline OAuth refresh token, server environment only.
- `CMS_UPLOAD_TICKET_SECRET` — independently generated random secret of at least 32 characters. Keep stable across restarts so active upload tickets remain valid.

Use a dedicated **Scoped access / App folder** Dropbox app. Required scopes:
`files.content.write`, `files.content.read`, `files.metadata.read`. Do not grant Full Dropbox,
sharing, deletion, contacts or team scopes. Request offline access through the authorization
code flow. The owner must approve the new app access at connection time. Never send secrets
in chat, put them in Git, a public URL or client code. OAuth provisioning/secure token placement
is the next setup task, not completed by this code change.

Upload UI reuses the existing file fields for brands, cards and case blocks. Files are sent in
4 MiB chunks, with progress, pause, retry and cancellation. No 25 MiB cap or transcoding.
Provider maximum is checked; actual account quota and hosting/network constraints still apply.
Resuming is supported while the editor tab retains the File and ticket (including a CMS server
restart). Closing/reloading the tab currently requires selecting and uploading the file again.
Tickets expire after 48 hours. At most three UI jobs run concurrently. Completed notices hide
automatically. Cancellation stops transfer; it does not delete a file that already committed.

All uploads use unique root-level filenames within the app folder and never overwrite existing
media. Files stay private: the saved `src` is `/api/media/file/<asset>`, served only after GitHub
owner authentication. SVG responses are sandboxed; video Range requests are forwarded. Dropbox
tokens never reach the browser. No public shared links are created; TEST previews remain private.
**These private URLs are not suitable for GitHub Pages production**: any future production
publisher must explicitly promote selected assets and rewrite URLs only after owner approval.
Do not publish content containing private `/api/media/file/` paths to the public site.

The adapter does not write to Render disk. API errors are sanitized. Writes use the existing
session/Origin/CSRF guards. Encrypted upload tickets bind session ID, size, type and asset path to
the owner and survive a server restart when the ticket secret is unchanged.

Before enabling for daily use: connect the App-folder authorization, deploy this branch to the
TEST service, upload one image and a video over 25 MiB, pause/resume, save/reload the draft,
verify private preview/video seeking, and confirm that a signed-out browser cannot access files.
Do not mark this live acceptance complete based on mocked API tests.

API references used:
- https://docs.dropboxapi.com/dropbox-api/api-reference/user-endpoints/files/upload-session-append-v-2
- https://docs.dropboxapi.com/dropbox-api/api-reference/user-endpoints/files/upload-session-finish
- https://docs.dropboxapi.com/dropbox-api/api-reference/user-endpoints/files/download
