# Markdown

__Markdown__（マークダウン）は、文書を記述するための[軽量マークアップ言語](https://ja.wikipedia.org/wiki/軽量マークアップ言語)のひとつである。
本来は _プレーンテキスト_ 形式で手軽に書いた文書から[HTML][]を生成するために開発されたものである。
しかし、現在ではHTMLのほかパワーポイント形式やLaTeX形式のファイルへ変換するソフトウェア（**コンバータ**）も開発されている。
各コンバータの開発者によって多様な*拡張*が施されるため、各種の方言が存在する。

[HTML]: https://ja.wikipedia.org/wiki/HyperText_Markup_Language

## 概要
「書きやすくて読みやすいプレーンテキストとして記述した文書を、妥当な
XHTML（もしくはHTML）文書へと変換できるフォーマット」として、ジョン・
グルーバー <https://en.wikipedia.org/wiki/John_Gruber> により作成
された。アーロン・スワーツも大きな貢献をしている。
Markdownの記法の多くは、電子メールにおいてプレーンテキストを
装飾する際の慣習から着想を得ている。

``Markdown.pl``は、その後第三者によってCPANのPerlモジュール (`Text::Markdown`) として再実装され、さらにPython等の他のプログラミング言語でも実装された。

## 利用例と方言
以下にMarkdownの利用例を挙げる。

- Stack Overflowや他のStack Exchange Networkサイトは、Markdownを改変した方言をデフォルトのフォーマットシステムとして利用している。
- PosterousはMarkdownをマークアップの選択肢として提供している。

1. “RFC 7763”. IETF. 2018年12月12日閲覧。
2. Aaron Swartz (2004年3月19日). “Markdown”. 2018年12月12日閲覧。

### コード
```javascript
(() => {
  'use strict';

  console.log('Hello world');
  /* コード中リテラル \*、\_、\` */
})();
```

文中でリテラルとして使うには\*、\_、\`とする。インラインコード内は``*_``。
`` ` ``は1つのバッククォートとなる。
