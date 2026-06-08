# Content Editing

制作物ページは `content/projects/*.yml` を編集して管理します。

1. 既存のYAMLをコピーして、`id` と `slug` を変更する
2. タイトル、画像、リンク、動画、英語文を入力する
3. `npm run build` を実行する

研究発表・受賞は `content/publications.yml` を編集して管理します。

1. `kind` は `peer`, `nonpeer`, `award` のいずれかを指定する
2. 著者名を太字にしたい場合は `highlight: true` を付ける
3. `npm run build` を実行する

ビルドすると以下が自動生成されます。

- `assets/project-data.js`
- `assets/publication-data.js`
- `creation/<slug>/index.html`
- `404.html` の旧URLリダイレクト定義

`creation/` 以下のHTMLは生成物なので、直接編集せずYAMLを編集してください。

このリポジトリは GitHub Pages でルート配信する想定のため、現状では `creation/` は
ignore しないでコミットしてください。GitHub Actions などでビルドしてから配信する構成に
変えた場合は、`creation/` を ignore しても問題ありません。
