const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyA8Zuc_VCWK4pL24SGODA2IuzT5LEqXG1ZplCUxwprSDRVuyQcdg4togunfyS_YuzG-g/exec';

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
          <div>
            <a href="javascript:void(0)"
              onclick="openModal(this); return false;"
              data-id="${item.item_id}"
              data-name="${item.item_name}"
              data-comment="${item.comment}"
            >
              <!-- 画像 -->
              <div class="item_img_wrap">
                <img src="./storage/images/thumbnail/test/${item.item_id}.jpg" alt="">
              </div>
              <!-- 名前 -->
              <p class="item_title">${item.item_name}</p>
            </a>
            <!-- コメント -->
            <p class="item_comment">${item.comment}</p>
            <!-- タグ -->
            <div class="item_tags">
              <span class="genre"><a href="?genre=${item.item_genre}">${item.item_genre}</a></span>
              <span><a href="?tag=${item.tags[0]}">${item.tags[0]}</a></span>
              <span><a href="?tag=${item.tags[1]}">${item.tags[1]}</a></span>
              <span><a href="?tag=${item.tags[2]}">${item.tags[2]}</a></span>
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
  // TODO② スプレッドシートからJSONを取得
  fetch(GAS_ENDPOINT, {
    method: 'GET'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('HTTP error: ' + response.status);
    }
    console.log(response);
    return response.json();
  })
  .then(data => {
    console.log(data);
    // キーワードがある場合、絞込みを実施
    let pre_query = decodeURIComponent(window.location.search);
    let filtered = data;
    if (pre_query) {
      // パラメータをKVに分割
      let query = pre_query.replace("?", "").split("=");

      // ジャンルで絞込み
      if (query[0] == "genre")
        filtered = data.filter(i => i.item_genre == query[1]);

      // タグで絞込み
      if (query[0] == "tag")
        filtered = data.filter(i => i.tags.includes(query[1]));
    }

    // 登録日の降順にソート
    items = filtered.sort((a, b) =>
      a.registration_date.localeCompare(b.registration_date)
    );

    // 件数を表示
    document.getElementById("items_count").innerHTML = items.length;

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
      <img id="modalImg" src="./storage/images/thumbnail/test/${trigger.dataset.id}.jpg" alt="">
    </div>
    <p><span id="modalComment">${trigger.dataset.comment}</span></p>

    <div class="modal_btn_wrapper">
      <button class="modal_btn download" onclick="downloadItem('${trigger.dataset.id}','/storage/images/thumbnail/test/${trigger.dataset.id}.jpg')">ダウンロード</button>
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

  // モーダルを閉じる
  closeModal();

  // TODO③ 集計
  sendIdToGAS(id);
}

// 素材のダウンロード数に加算
async function sendIdToGAS(id) {

  console.log("加算１");

  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error('id must be a non-empty string');
  }

  console.log("加算２");

  const response = await fetch(GAS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 'id': id })
  });

  console.log("加算３");

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
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
        a.registration_date.localeCompare(b.registration_date)
      );
    }

    // 名前順
    if (selectedValue == "name") {
      items = items.sort((a, b) =>
        a.item_name.localeCompare(b.item_name, undefined, { numeric: true })
      );
    }

    // 人気順
    if (selectedValue == "popularity") {
      items = items.sort((a, b) =>
        b.download_count - a.download_count
      );
    }

    // 現在の読み込み件数を初期化
    currentIndex = 0;

    // 再描画
    renderNextItems();
    setupObserver();
  });
}
