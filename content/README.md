# Content Editing

制作物ページは `content/projects/*.yml` を編集して管理します。

1. 既存のYAMLをコピーして、`id` と `slug` を変更する
2. タイトル、画像、リンク、動画、英語文を入力する
3. `npm run build` を実行する

研究発表・受賞は `content/publications.yml` を編集して管理します。

1. `kind` は `peer`, `nonpeer`, `award` のいずれかを指定する
2. 著者名を太字にしたい場合は `highlight: true` を付ける
3. `npm run build` を実行する

メディア掲載・出演は `content/media.yml` を編集して管理します。

1. `kind` は `tv`, `book`, `web`, `magazine`, `event`, `other` のいずれかを指定する
2. テレビ・書籍などリンクがない掲載歴は `url` を省略できる
3. 英語表示も整えたい場合は `en` に翻訳文を入力する
4. `npm run build` を実行する

ビルドすると以下が自動生成されます。

- `assets/project-data.js`
- `assets/publication-data.js`
- `assets/media-data.js`
- `creation/<slug>/index.html`
- `404.html` の旧URLリダイレクト定義

これらの生成物は `.gitignore` に入れているので、コミットしません。
GitHub Actions が deploy 前に `npm run build` を実行し、公開用 artifact に含めます。

ローカルで確認するときも、YAMLを編集したあとは `npm run build` を実行してください。
`creation/` 以下のHTMLは直接編集せず、必ず `content/projects/*.yml` を編集します。
