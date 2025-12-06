# TermTable検索Reactアプリ（Document / Previous / Next 対応版）

- ブラウザで `TermTable2.xlsx` を読み込み
- `Term` または `Japanese` で検索（**部分一致／完全一致** 切替）
- 表示項目：

  `Term, Abbreviation, Japanese, Definition, Notes, Classification, Document, Clause, Source, Status, Previous, Next`

- 検索結果は **Document → Clause の昇順** で自動ソート
- 100% クライアントサイド（サーバ不要）
- React + Vite + xlsx（SheetJS）

## ローカルでの使い方

```bash
npm install
npm run dev
# http://localhost:5173 にアクセス
```

## GitHub Pages へ公開

1. `vite.config.js` の `base` を `/あなたのリポジトリ名/` に設定  
   例）`base: '/termtable-search-react/'`
2. このリポジトリを GitHub にプッシュ（main ブランチ）
3. Actions が自動でビルド＆Pagesへデプロイ
4. `Settings > Pages` で公開URLを確認

## Excel の列名

1行目（ヘッダ）に以下の列名を用意しておくと確実です：  

`Term, Abbreviation, Japanese, Definition, Notes, Classification, Document, Clause, Source, Status, Previous, Next`

ただし、次のような表記ゆれも自動で吸収します：

- `Standard` → `Document`
- `previous version`, `prev_version`, `PreviousVersion` など → `Previous`
- `next version`, `next_version`, `NextVersion` など → `Next`
