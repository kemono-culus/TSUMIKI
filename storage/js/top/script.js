/**
 * リストの制御
 */

const ITEMS_PER_LOAD = 20;  // 1回当たりの読込み件数

let items = [];       // JSONの値を保持
let genre = [];       // JSONの値を保持
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
              <span class="genre ${item.genre_code}"><a href="?genre=${item.genre_code}">${genre[item.genre_code]}</a></span>
    `;

    // タグ
    JSON.parse(item.tags).forEach(tag => {
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
async function loadItemList() {
  // ジャンル一覧を読み込み
  await setGenreList();

  // 素材一覧を読み込み
  fetch('https://opensheet.elk.sh/1bUMcoxQrrlIwkMa8HzkQC7dBaqnCWz9z7pBp3qyckSg/item')
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
        filtered = data.filter(i => i.genre_code == query[1]);

      // タグで絞込み
      if (query[0] == "tag")
        filtered = data.filter(i => JSON.parse(i.tags).includes(query[1]));
    }

    // 登録日の降順にソート
    items = filtered.sort((a, b) =>
      b.post_date.localeCompare(a.post_date)
    );

    // キーワード、絞込み件数を表示
    if (pre_query) {
      if (query[0] == "genre") {
        document.getElementById("current_items").innerHTML = `ジャンル： ${genre[query[1]]} (${items.length})`;

      } else {

        document.getElementById("current_items").innerHTML = `タグ： ${query[1]} (${items.length})`;
      }

    } else {

      document.getElementById("current_items").innerHTML = `すべて (${items.length})`;
    }

    // 素材一覧を描画
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

// ジャンル一覧を描画
async function setGenreList() {
  // JSONを読み込み
  await fetch('https://opensheet.elk.sh/1bUMcoxQrrlIwkMa8HzkQC7dBaqnCWz9z7pBp3qyckSg/genre')
  .then(response => {
    if (!response.ok) {
      throw new Error('JSONの読み込みに失敗しました');
    }
    return response.json();
  })
  .then(data => {
    // ジャンル一覧を連想配列に追加
    data.forEach(item => { genre[item.id] = item.name });

    // HTMLを組み立て
    let html = `
      <div id="genre_list" class="genre_list">
        <a href="${root}">
          <span class="genre all">すべて</span>
        </a>
    `;
    data.forEach(item => {
      html += `
        <a href="?genre=${item.id}">
          <span class="genre ${item.id}">${item.name}</span>
        </a>
      `;
    });
    html += "</div>";

    document.getElementById("genre_list").innerHTML = html;
  })
  .catch(error => {
    console.error('エラー:', error);
  });
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
      <button class="modal_btn download" onclick="downloadItem('${trigger.dataset.id}','${trigger.dataset.name}','./storage/images/data/${trigger.dataset.id}.zip')">ダウンロード</button>
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
function downloadItem(id, name, path) {
  var a = document.createElement('a');
  a.style.display = 'none';
  a.download = id;
  a.href = path;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // POST
  sendData(id, name);

  // モーダルを閉じる
  closeModal();
}


// ソート順を変えて再描画
function setDropdownMenu(){
  const select = document.getElementById("sort_key");

  select.addEventListener("change", function () {
    // プログラムで扱う値
    const selectedValue = this.value;

    // 新しい順
    if (selectedValue == "newest") {
      items = items.sort((a, b) =>
        b.post_date.localeCompare(a.post_date)
      );
    }

    // 古い順
    if (selectedValue == "oldest") {
      items = items.sort((a, b) =>
        a.post_date.localeCompare(b.post_date)
      );
    }

    // 人気順
    if (selectedValue == "popular") {
      items = items.sort((a, b) =>
        b.download_count - a.download_count
      );
    }

    // 名前順（Ａ-Ｚ）
    if (selectedValue == "name_az") {
      items = items.sort((a, b) =>
        a.item_name.localeCompare(b.item_name, undefined, { numeric: true })
      );
    }

    // 名前順（Ｚ-Ａ）
    if (selectedValue == "name_za") {
      items = items.sort((a, b) =>
        b.item_name.localeCompare(a.item_name, undefined, { numeric: true })
      );
    }

    // 現在の読み込み件数を初期化
    currentIndex = 0;

    // 再描画
    renderNextItems();
    setupObserver();
  });
}



// ダウンロード実績を集計
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwYqRnwoFprUJfJGaBR2rHK_4tRCr5H-XRB1lcVCQfvrvZEMPqrXukDr-rYRFQW9cAVgg/exec';
function sendData(id, name) {
  const data = {
    id: id,
    name: name
  };

  fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .catch(error => console.error('Error:', error));
}



// 画面のロード時に実行
document.addEventListener("DOMContentLoaded", loadItemList);
