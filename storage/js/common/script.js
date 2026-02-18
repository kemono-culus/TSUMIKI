// root URL
const root = "https://kemono-culus.github.io/TSUMIKI/";

// 画面のロード時に実行
document.addEventListener("DOMContentLoaded", loadContents);

// 初期処理
function loadContents() {
  // 共通部分を描画
  setHeader();
  setFooter();
}

// ヘッダーを描画
function setHeader() {
  document.getElementsByTagName("header")[0].innerHTML = `
    <div class="header_area">
      <div class="header_left">
        <a href="${root}">
          <img src="${root}storage/images/common/logo_black.png" height="52" alt="TSUMIKI | Scratch利用OKのフリーイラスト素材サイト">
        </a>
      </div>
      <div class="header_right">
        <nav>${getSiteMap()}</nav>
      </div>
    </div>
  `;
}

// フッターを描画
function setFooter() {
  document.getElementsByTagName("footer")[0].innerHTML = `
    <div class="footer_top">
        <nav>${getSiteMap()}</nav>
    </div>
    <div class="footer_bottom">
      <a href="${root}">
        <img src="${root}storage/images/common/logo_white.png" height="52" alt="TSUMIKI | Scratch利用OKのフリーイラスト素材サイト">
      </a>
      <p>©けものくるす</p>
    </div>
  `;
}

// ヘッダー、フッターの共通部分を返す
function getSiteMap() {
  return `
    <ul>
      <li><a class="nav_item" href="${root}pages/rule" target="_self">利用規約</a></li>
      <li><a class="nav_item" href="${root}pages/about" target="_self">サイトについて</a></li>
    </ul>
  `;
}
