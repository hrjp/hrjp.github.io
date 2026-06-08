# Content Editing

制作物ページは `content/projects/*.yml` を編集して管理します。

1. 既存のYAMLをコピーして、`id` と `slug` を変更する
2. タイトル、画像、リンク、動画、英語文を入力する
3. `npm run build` を実行する

ビルドすると以下が自動生成されます。

- `assets/project-data.js`
- `creation/<slug>/index.html`
- `404.html` の旧URLリダイレクト定義

`creation/` 以下のHTMLは生成物なので、直接編集せずYAMLを編集してください。
