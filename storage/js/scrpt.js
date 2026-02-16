/**
 * リストの制御
 */

const ITEMS_PER_LOAD = 20;  // 1回当たりの読込み件数

let items = [];       // JSONの値を保持
let currentIndex = 0; // 現在の読み込み件数を保持

// 画像素材を表示する（20件ずつ）
function renderNextItems() {
  const list = document.getElementById("item_list");
  let html = "";

  // 現在の読み込み件数＋20件を取得
  const slice = items.slice(currentIndex, currentIndex + ITEMS_PER_LOAD);

  slice.forEach(item => {
    html += `
        <li>
          <div id="${item.item_id}">
            <a href="javascript:void(0)"
              onclick="openModal(this); return false;"
              data-id="${item.item_id}"
              data-name="${item.item_name}"
              data-comment="${item.comment}"
            >
              <div class="item_img_wrap">
                <img src="./storage/images/thumbnail/${item.item_id}.jpg" alt="Scratch用 ${item.item_name} の無料画像素材" loading="lazy">
              </div>
              <h3 class="item_title">${item.item_name}</h3>
            </a>
            <p class="item_comment">${item.comment}</p>
            <div class="item_tags">
              <span class="genre ${item.genre_code}"><a href="?genre=${item.item_genre}">${item.item_genre}</a></span>
    `;

    // タグ
    item.tags.forEach(tag => {
      html += `<span><a href="?tag=${tag}">${tag}</a></span>`;
    });

    html += `
            </div>
          </div>
        </li>
    `;
  });

  // 初回のみ置換、以後は追記
  if (currentIndex == 0) {
    list.innerHTML = html;
  } else {
    // リストの末尾に追加
    list.insertAdjacentHTML("beforeend", html);
  }
  currentIndex += slice.length;
}

// JSONを読み込んで初期化
function loadItemList() {
  // jsonを読み込み
  fetch('./storage/json/data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('JSONの読み込みに失敗しました');
    }
    return response.json();
  })
  .then(data => {
    // キーワードがある場合、絞込みを実施
    let pre_query = decodeURIComponent(window.location.search);
    let query = "";
    let filtered = data;
    if (pre_query) {
      // パラメータをKVに分割
      query = pre_query.replace("?", "").split("=");

      // ジャンルで絞込み
      if (query[0] == "genre")
        filtered = data.filter(i => i.item_genre == query[1]);

      // タグで絞込み
      if (query[0] == "tag")
        filtered = data.filter(i => i.tags.includes(query[1]));
    }

    // 登録日の降順にソート
    items = filtered.sort((a, b) =>
      b.post_date.localeCompare(a.post_date)
    );

    // キーワード、絞込み件数を表示
    if (pre_query) {
      document.getElementById("current_items").innerHTML = `${query[0]}:${query[1]} (${items.length})`;
    } else {
      document.getElementById("current_items").innerHTML = `All Works (${items.length})`;
    }

    // 描画
    renderNextItems();
    setupObserver();

    // ドロップダウンメニューを設定
    setDropdownMenu();
  })
  .catch(error => {
    console.error('エラー:', error);
  });
}

// スクロール監視
function setupObserver() {
  // ID「sentinel」が読み込まれた＝最下部までスクロールされた
  const sentinel = document.getElementById("sentinel");

  const observer  = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (currentIndex < items.length) {
        renderNextItems();
      } else {
        // 全件出力されたら、監視終了
        observer.disconnect();
      }
    }
  });

  observer.observe(sentinel);
}



/**
 * モーダルの制御
 */

function openModal(trigger) {
  // モーダルを作成して表示
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modalContent");

  let html = `
    <p><span id="modalName">${trigger.dataset.name}</span></p>
    <div class="modal_img_wrapper">
      <img id="modalImg" src="./storage/images/thumbnail/${trigger.dataset.id}.jpg" alt="${trigger.dataset.name}" loading="lazy">
    </div>
    <p><span id="modalComment">${trigger.dataset.comment}</span></p>

    <div class="modal_btn_wrapper">
      <button class="modal_btn download" onclick="downloadItem('${trigger.dataset.id}','./storage/images/data/${trigger.dataset.id}.zip')">ダウンロード</button>
      <button class="modal_btn" onclick="closeModal()">閉じる</button>
    </div>
  `
  modalContent.innerHTML = html;

  modal.classList.remove("hidden");
  //document.body.classList.add("no-scroll");
}

// モーダルを閉じる
function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

// 素材をダウンロード
function downloadItem(id, path) {
  var a = document.createElement('a');
  a.style.display = 'none';
  a.download = id;
  a.href = path;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // POST
  sendData();

  // モーダルを閉じる
  closeModal();
}

// 画面のロード時に実行
document.addEventListener("DOMContentLoaded", loadItemList);



// ソート順を変えて再描画
function setDropdownMenu(){
  const select = document.getElementById("sort_key");

  select.addEventListener("change", function () {
    // プログラムで扱う値
    const selectedValue = this.value;

    // 新着順
    if (selectedValue == "newest") {
      items = items.sort((a, b) =>
        b.post_date.localeCompare(a.post_date)
      );
    }

    // 名前順
    if (selectedValue == "name") {
      items = items.sort((a, b) =>
        a.item_name.localeCompare(b.item_name, undefined, { numeric: true })
      );
    }

    // 現在の読み込み件数を初期化
    currentIndex = 0;

    // 再描画
    renderNextItems();
    setupObserver();
  });
}

// デプロイしたURL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzkk74yaY7snu6tyJO4iuDNhZXbqekHym-X7XyEQxRGRx1X02FZ5_1f8KE2u6krI2B7HA/exec';

function sendData() {
  const data = {
    name: "test",
    message: "test"
  };

  fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors', // CORSエラーを避けるための設定
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => console.log('Success!'))
  .catch(error => console.error('Error:', error));
}
