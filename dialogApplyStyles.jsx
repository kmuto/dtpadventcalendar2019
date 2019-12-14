/*
  テキストタグ→スタイル反映スクリプト
  Copyright 2011-2019 Kenshi Muto <kmuto@kmuto.jp>

  Version: 2019121401

  [セットアップ]
  ユーザ名/ライブラリ/Preferences/Adobe InDesign/バージョン/ja_JP/Scripts/Scripts Panel あるいはそのサブフォルダを作成し、
  その中にこのファイルとdialogChooseStyleDefs.jsxを置いてください。

  [定義ファイルの作成]
  本のスタイルに合わせて、定義ファイルを作成します。内容はサンプルを参照して
  ください。正規表現に対し、置き換えられる文字と、適用する段落スタイル・
  文字スタイルをこの定義ファイルに書いていきます。定義ファイルはどこに置いて
  もかまいません。ファイル名も適当でかまいません。

  [定義ファイルの指定]
  dialogChooseStyleDefs.jsx を実行し、使用する定義ファイルを指定します。
  この指定は、各作業環境固有で、InDesign DTPデータなどに含まれるわけでは
  ありません。

  [実行方法]
  テキストフレームにタグ付きテキストを入れておき、そのテキストフレームを
  選択している状態でこのスクリプト dialogApplyStyles.jsx を実行します。
  すると、定義ファイルに従って、文字の置換および段落スタイル、文字スタイル
  の反映が行われます。
  テキストフレームが連結している場合、連結している範囲すべてを対象にします。

  スクリプトは、InDesignのウィンドウ→自動化→スクリプト の
  ユーザ→stylesフォルダ→dialogApplyStyles.jsx のダブルクリックで呼び出せます。

  が、頻度が高いときには下記の手順でショートカットに登録しておくとよいでしょう。

  編集→キーボードショートカット→機能エリアから「スクリプト」→
  styles:dialogApplyStyles.jsx を選択→
  新規ショートカットをクリックしてキーボードのショートカットキーを入力→OK

  テキストフレームを選択してショートカットキーを押すことで呼び出せます。
  ショートカットキーはたとえばOpt+S などが空いているようです。
*/

// 参照定義ファイルを返す
function checkPath(defpath) {
  if (File(defpath).exists) {
    fObj = File(defpath);
    fObj.open("r");
    var filepath = fObj.readln();
    fObj.close();
    return filepath;
  } else {
    return "";
  }
}

// 代替文字列を実際の文字に変換
function sep(str) {
  var res = str;
  if (str == "TAB") {
    res = "\t"
  } else if (str == "CR") {
    res = "\r"
  }
}

// 段落スタイルオブジェクトを取得
function getPStyle(path, group) {
  if (path.length == 1 && group.paragraphStyles.item(path[0]) != null) {
    return group.paragraphStyles.item(path[0]);
  } else if (path.length > 1) {
    var elt = group.paragraphStyleGroups.item(path[0]);
    if (elt == null) return null; // スタイルグループがない
    path.shift();
    return getPStyle(path, elt);
  }
  return null; // みつからない
}

// 文字スタイルオブジェクトを取得
function getCStyle(path, group) {
  if (path.length == 1 && group.characterStyles.item(path[0]) != null) {
    return group.characterStyles.item(path[0]);
  } else if (path.length > 1) {
    var elt = group.characterStyleGroups.item(path[0]);
    if (elt == null) return null; // スタイルグループがない
    path.shift();
    return getCStyle(path, elt);
  }
  return null; // みつからない
}

// 表スタイルオブジェクトを取得
function getTStyle(path, group) {
  if (path.length == 1 && group.tableStyles.item(path[0]) != null) {
    return group.tableStyles.item(path[0]);
  } else if (path.length > 1) {
    var elt = group.tableStyleGroups.item(path[0]);
    if (elt == null) return null; // スタイルグループがない
    path.shift();
    return getTStyle(path, elt);
  }
  return null; // みつからない
}

// セルスタイルオブジェクトを取得
function getEStyle(path, group) {
  if (path.length == 1 && group.cellStyles.item(path[0]) != null) {
    return group.cellStyles.item(path[0]);
  } else if (path.length > 1) {
    var elt = group.cellStyleGroups.item(path[0]);
    if (elt == null) return null; // スタイルグループがない
    path.shift();
    return getEStyle(path, elt);
  }
  return null; // みつからない
}

// 定義ファイルを実行する前に解析してグローバル変数に取り込みおよびスタイルチェック
function validateConf(document, confpath, delimiter) {
  var fObj = File(confpath);
  fObj.encoding = "UTF8";
  fObj.open("r");
  var lineno = 0;
  var errs = [];
  while (!fObj.eof) {
    var fline = fObj.readln();
    lineno++;
    if (fline.match(/^#/)) {
      continue;
    } else if (fline.match(/^TITLE\t(.+)/)) {
      _title = fline.match(/^TITLE\t(.+)/)[1];
    } else if (fline.match(/^WIDTH\t(.+)/)) {
      _twidth = fline.match(/^WIDTH\t(.+)/)[1];
    } else if (fline.match(/^POSITION\t(.+)/)) {
      _tposition = fline.match(/^POSITION\t(.+)/)[1];
    } else if (fline.match(/^P\t/)) {
      var sa = fline.split(/\t/);
      // P 正規表現 置換表現 段落スタイル名
      //  または
      // P 正規表現 置換表現 段落スタイル名 元段落スタイル名
      if (sa.length < 4 || sa.length > 5) {
        errs.push(lineno + "行: 段落スタイル適用行が4列または5列で構成されていません。");
      } else {
        // 存在チェック
        if (!getPStyle(sa[3].split(delimiter), document))
          errs.push(lineno + "行: 段落スタイル" + sa[3] + " が見つかりません。");
        if (sa.length == 5 && !getPStyle(sa[4].split(delimiter), document))
          errs.push(lineno + "行: 段落スタイル" + sa[4] + " が見つかりません。");
      }
    } else if (fline.match(/^C\t/)) {
      var sa = fline.split(/\t/);
      // C 正規表現 置換表現 文字スタイル名 親段落スタイル名 元文字スタイル名
      //   または
      // C 正規表現 置換表現 文字スタイル名 親段落スタイル名
      //   または
      // C 正規表現 置換表現 文字スタイル名
      if (sa.length < 4 || sa.length > 6) {
        errs.push(lineno + "行: 文字スタイル適用行が4列〜6列で構成されていません。");
      } else {
        // 存在チェック
        if (!getCStyle(sa[3].split(delimiter), document))
          errs.push(lineno + "行: 文字スタイル" + sa[3] + " が見つかりません。");
        if (sa.length > 4 && sa.length[4] != "" && !getPStyle(sa[4].split(delimiter), document))
          errs.push(lineno + "行: 段落スタイル" + sa[4] + " が見つかりません。");
        if (sa.length > 5 && sa.length[5] != "" && !getCStyle(sa[5].split(delimiter), document))
          errs.push(lineno + "行: 文字スタイル" + sa[5] + " が見つかりません。");
      }
    } else if (fline.match(/^R\t/)) {
      var sa = fline.split(/\t/);
      // R 正規表現 置換表現 親段落スタイル名 親文字スタイル名
      //   または
      // R 正規表現 置換表現 親段落スタイル名
      //   または
      // R 正規表現 置換表現
      if (sa.length < 3 || sa.length > 5) {
        errs.push(lineno + "行: 置換適用行が3列〜5列で構成されていません。");
      } else {
        // 存在チェック
        if (sa.length > 3 && sa[3] != "" && !getPStyle(sa[3].split(delimiter), document))
          errs.push(lineno + "行: 段落スタイル" + sa[3] + " が見つかりません。");
        if (sa.length > 4 && !getCStyle(sa[4].split(delimiter), document))
          errs.push(lineno + "行: 文字スタイル" + sa[4] + " が見つかりません。");
      }
    } else if (fline.match(/^T\t/)) {
      var sa = fline.split(/\t/);
      // T 正規表現 列分解 行分解 表スタイル名
      //   または
      // T 正規表現 列分解 行分解 1行目セルスタイル名 最終行セルスタイル名 中間行セルスタイル名 単一行セルスタイル名
      //   または
      // T 正規表現 列分解 行分解 1行目セルスタイル名 2行目以降のセルスタイル名 左列セルスタイル名
      if (sa.length < 5 || sa.length > 8) {
        errs.push(lineno + "行: 表スタイル適用行が5〜8列で構成されていません。");
      } else {
        // 存在チェック
        if (sa.length == 5 && !getTStyle(sa[4].split(delimiter), document))
          errs.push(lineno + "行: 表スタイル" + sa[4] + " が見つかりません。");
        if (sa.length > 5) {
          if (!getEStyle(sa[4].split(delimiter), document))
            errs.push(lineno + "行: セルスタイル" + sa[4] + " が見つかりません。");
          if (sa.length > 4 && !getEStyle(sa[5].split(delimiter), document))
            errs.push(lineno + "行: セルスタイル" + sa[5] + " が見つかりません。");
          if (sa.length > 5 && !getEStyle(sa[6].split(delimiter), document))
            errs.push(lineno + "行: セルスタイル" + sa[6] + " が見つかりません。");
          if (sa.length > 6 && !getEStyle(sa[7].split(delimiter), document))
            errs.push(lineno + "行: セルスタイル" + sa[7] + " が見つかりません。");
        }
      }
    }
  }

  if (errs.length > 0) {
    alert("定義ファイルにエラーがあります。\n" + errs.join("\n"));
    return false;
  }
    return true;
}

// 定義ファイルの読み込みと実行
function runConf(document, story, confpath, delimiter) {
  var fObj = File(confpath);
  fObj.encoding = "UTF8";
  fObj.open("r");
  var lineno = 0;
  var errs = [];
  while (!fObj.eof) {
    var fline = fObj.readln();
    lineno++;
    try {
      if (fline.match(/^P\t/)) {
        replacePStyle(document, story, fline.split(/\t/), delimiter);
      } else if (fline.match(/^C\t/)) {
        replaceCStyle(document, story, fline.split(/\t/), delimiter);
      } else if (fline.match(/^R\t/)) {
        replaceString(document, story, fline.split(/\t/), delimiter);
      } else if (fline.match(/^T\t/)) {
        replaceTable(document, story, fline.split(/\t/), delimiter);
      } else if (fline.match(/^ENDINPUT/)) {
        break;
      }
    } catch(e) {
      alert(lineno + "行: 置換中にエラーが発生しました。" + e);
      break;
    }
  }
  resetFind();
}

// 検索パネル初期化
function resetFind() {
  app.findGrepPreferences = NothingEnum.NOTHING;
  app.changeGrepPreferences = NothingEnum.NOTHING;
  app.findChangeGrepOptions  = NothingEnum.NOTHING;
  app.findChangeGrepOptions.widthSensitive = true;
}

// 段落置換
function replacePStyle(document, story, sa, delimiter) {
  // P 正規表現 置換表現 段落スタイル名
  //  または
  // P 正規表現 置換表現 段落スタイル名 元段落スタイル名
  resetFind();
  app.findGrepPreferences.findWhat = sa[1];
  app.changeGrepPreferences.changeTo = sa[2];
  app.changeGrepPreferences.appliedParagraphStyle = getPStyle(sa[3].split(delimiter), document);
  if (sa.length == 5)
    app.findGrepPreferences.appliedParagraphStyle = getPStyle(sa[4].split(delimiter), document);

  story.changeGrep();
}

// 文字スタイル置換
function replaceCStyle(document, story, sa, delimiter) {
  // C 正規表現 置換表現 文字スタイル名 親段落スタイル名 元文字スタイル名
  //   または
  // C 正規表現 置換表現 文字スタイル名 親段落スタイル名
  //   または
  // C 正規表現 置換表現 文字スタイル名
  resetFind();
  app.findGrepPreferences.findWhat = sa[1];
  app.changeGrepPreferences.changeTo = sa[2];
  app.changeGrepPreferences.appliedCharacterStyle = getCStyle(sa[3].split(delimiter), document);
  if (sa.length > 4 && sa[4] != "")
    app.findGrepPreferences.appliedParagraphStyle = getPStyle(sa[4].split(delimiter), document);
  if (sa.length > 5 && sa[5])
    app.findGrepPreferences.appliedCharacterStyle = getCStyle(sa[5].split(delimiter), document);

  story.changeGrep();
}

// 文字列置換
function replaceString(document, story, sa, delimiter) {
  // R 正規表現 置換表現 親段落スタイル名 親文字スタイル名
  //   または
  // R 正規表現 置換表現 親段落スタイル名
  //   または
  // R 正規表現 置換表現
  resetFind();
  app.findGrepPreferences.findWhat = sa[1];
  app.changeGrepPreferences.changeTo = sa[2];
  if (sa.length > 3 && sa[3] != "")
    app.findGrepPreferences.appliedParagraphStyle = getPStyle(sa[3].split(delimiter), document);
  if (sa.length > 4)
    app.findGrepPreferences.appliedCharacterStyle = getCStyle(sa[4].split(delimiter), document);
  story.changeGrep();
}

// 表置換
function replaceTable(document, story, sa, delimiter) {
  // T 正規表現 列分解 行分解 表スタイル名
  //   または
  // T 正規表現 列分解 行分解 1行目セルスタイル名 2行目以降のセルスタイル名 左列セルスタイル名
  //   または
  // T 正規表現 列分解 行分解 1行目セルスタイル名 最終行セルスタイル名 中間行セルスタイル名 単一行セルスタイル名
  resetFind();
  app.findGrepPreferences.findWhat = sa[1];
  sa[2] = sep(sa[2]); // 分解文字列のエスケープを戻す
  sa[3] = sep(sa[3]);
  var hits = story.findGrep();
  for (var i = 0; i < hits.length; i++) {
    var tbl;
    if (sa[2] == sa[3]) {
      tbl = hits[i].convertToTable(sa[2], sa[3], 1);
    } else {
      tbl = hits[i].convertToTable(sa[2], sa[3]);
    }
    if (sa.length == 5) // 表スタイル適用
      tbl.appliedTableStyle = getTStyle(sa[4].split(delimiter), document);

    if (_tposition) // 表のある段落のスタイル
      tbl.parent.appliedParagraphStyle = getPStyle(document, _tposition);
    if (_twidth)
      tbl.width = _twidth;

    if (sa.length > 6) {
      var rows = tbl.rows;
      for (var r = 0; r < rows.length; r++) {
        if (r == 0) { // 1行目
          var estyle = getEStyle(sa[4].split(delimiter), document);
          if (sa.length == 8 && rows.length == 1)  // 単一行
            estyle = getEStyle(sa[7].split(delimiter), document);
          for (var c = 0; c < rows[i].cells.length; i++)
            rows[r].cells[c].appliedCellStyle = estyle;
        } else if (r == rows.length - 1 &&  r != 0 && sa.length == 8) { // 末尾
          var estyle = getEStyle(sa[5].split(delimiter), document);
          for (var c = 0; c < rows[i].cells.length; i++)
            rows[r].cells[c].appliedCellStyle = estyle;
        } else { // それ以外の行
          var estyle;
          if (sa.length == 7) {
            estyle = getEStyle(sa[5].split(delimiter), document);
          } else {
            estyle = getEStyle(sa[6].split(delimiter), document);
          }
          for (var c = 0; c < rows[i].cells.length; i++)
            if (sa.length == 7 && c == 0) {
              // 左列
              rows[r].cells[c].appliedCellStyle = getEStyle(sa[6].split(delimiter), document);
            } else {
              rows[r].cells[c].appliedCellStyle = estyle;
            }
        }
      }
    }
  }
}

function main() {
  var defpath = "~/.styledefpath";
  var confpath = checkPath(defpath);
  if (!confpath) {
    alert("定義参照ファイル " + defpath + " が見つかりません。\n" +
          "最初に dialogChooseStyleDefs.jsx を使って定義ファイルを指定してください。");
    return;
  }

  if (validateConf(app.activeDocument, confpath)) {
    if (!(app.activeDocument.selection[0] instanceof TextFrame)) {
      // テキストフレームでない
      alert("スタイル反映対象のテキストフレームを選択してください。このフレームに連結するテキストフレームにもすべて反映されます。");
  	  return;
    }
    runConf(app.activeDocument, app.activeDocument.selection[0].parentStory, confpath, _delimiter);
  }
}

// グローバル変数
var _title, _twidth, _tposition, _delimiter;
_delimiter = "\\";
main();
