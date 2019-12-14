/*
  テキストタグ→スタイル反映スクリプトのための設定ダイアログ
  Copyright 2011-2019 Kenshi Muto <kmuto@kmuto.jp>

  実行すると、パターンマッチファイルを指定するダイアログが表示される。
  指定したファイルのファイルパスが「ホーム/.styledefpath」に保存され、
  dialogApplyStyles.jsxはこのファイル経由で実際のパターンマッチファイルを読み取る

  Version: 2019111401

*/
// おまじない
#target "InDesign"

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

// 参照定義ファイルパスを書き込む
function writePath(defpath, confpath) {
  var fObj = File(defpath);
  fObj.open("w");
  fObj.writeln(confpath);
  fObj.close();
}

// 定義ファイルのタイトルを取得する
function getTitle(confpath) {
  var title = "";
  if (File(confpath).exists) {
    var fObj = File(confpath);
    fObj.encoding = "UTF8";  
    fObj.open("r");
    while (!fObj.eof) {
      var fline = fObj.readln();
      if (fline.match(/^TITLE\t(.+)/)) {
        title = fline.match(/^TITLE\t(.+)/)[1];
        break;
      }
    }
    fObj.close();
    if (title == "") {
      alert("定義ファイル " + confpath + " にTITLE行がありませんでした。無名とします。\n指定のファイルが定義ファイルでない可能性があります。");
      title = "[無名]";
    }
    return title;
  } else {
    alert("定義ファイル " + confpath + " は見つかりませんでした。未定義とします。");
    return "[未定義]";
  }
}

var defpath = "~/.styledefpath";
var confpath = checkPath(defpath);
var title = "[未定義]";
if (confpath != "") title = getTitle(confpath);

// 表示ダイアログ
(function() {
  var dlg = new Window("dialog", "パターンマッチ定義ファイルの選択");
  var ftitle = dlg.add("statictext", undefined, title);
  var fpathlabel = dlg.add("statictext", undefined, confpath);
  dlg.add("button", undefined, "選択").onClick = function() {
    var fObj = File.openDialog ("定義ファイルを選択", "テキストファイル:*.txt,すべてのファイル:*");
    if (fObj != null) {
      var confpath = fObj.fsName;
      title = getTitle(confpath);
      ftitle.text = title;
      fpathlabel.text = confpath;
      writePath(defpath, confpath);
    }
  }
  dlg.add("button", undefined, "閉じる").onClick = function() { dlg.close(); }
  dlg.show();
})();
