const BOOKS = {
c: {
label: "大本",
folderText: "c_text",
codePrefix: "c"
},
ts: {
label: "小本",
folderText: "ts_text",
codePrefix: "ts"
}
};
const MAX_RANGES = 20;
const state = {
currentBook: "c",
data: { c: [], ts: [] },
loadedRanges: { c: {}, ts: {} },
loaded: { c: false, ts: false },
loading: false
};
function pad4(num) {
return String(num).padStart(4, "0");
}
function getRangeFilePath(bookKey, rangeIndex) {
const start = rangeIndex * 100 + 1;
const end = (rangeIndex + 1) * 100;
const folder = BOOKS[bookKey].folderText;
return `assets/${folder}/${bookKey}_${start}_${end}.json`;
}
async function loadRange(bookKey, rangeIndex) {
if (state.loadedRanges[bookKey][rangeIndex])
return true;
const url = getRangeFilePath(bookKey, rangeIndex);
try {
const res = await fetch(url);
if (!res.ok) {
state.loadedRanges[bookKey][rangeIndex] = true;
return false;
}
const json = await res.json();
if (!Array.isArray(json) || json.length === 0) {
state.loadedRanges[bookKey][rangeIndex] = true;
return false;
}
state.data[bookKey] = state.data[bookKey].concat(json);
state.loadedRanges[bookKey][rangeIndex] = true;
return true;
}
catch (e) {
console.error("加载失败:", bookKey, rangeIndex, e);
state.loadedRanges[bookKey][rangeIndex] = true;
return false;
}
}
async function loadAllRangesForBook(bookKey) {
if (state.loaded[bookKey])
return;
state.loading = true;
for (let i = 0; i < MAX_RANGES; i++) {
const ok = await loadRange(bookKey, i);
if (!ok)
break;
}
state.data[bookKey].sort((a, b) => (a.no || 0) - (b.no || 0));
state.loaded[bookKey] = true;
state.loading = false;
}
function renderList(bookKey) {
const listEl = document.getElementById("song-list");
const songs = state.data[bookKey] || [];
listEl.innerHTML = "";
songs.forEach(song => {
if (!song.no)
return;
const no = song.no;
const code = BOOKS[bookKey].codePrefix + pad4(no);
const li = document.createElement("li");
li.className = "song-item";
li.dataset.book = bookKey;
li.dataset.no = no;
const label = document.createElement("span");
label.className = "song-item-label";
label.textContent = `${BOOKS[bookKey].label} 第 ${no} 首`;
const codeSpan = document.createElement("span");
codeSpan.className = "song-item-code";
codeSpan.textContent = song.title ? song.title : "";
li.appendChild(label);
li.appendChild(codeSpan);
li.addEventListener("click", () => {
goToSong(bookKey, no);
});
listEl.appendChild(li);
});
}
function setActiveBook(bookKey) {
state.currentBook = bookKey;
document.getElementById("btn-book-c").classList.toggle("active", bookKey === "c");
document.getElementById("btn-book-ts").classList.toggle("active", bookKey === "ts");
}
function goToSong(book, no) {
window.location.href = `song.html?book=${book}&no=${no}`;
}
function handleSearch() {
const raw = document.getElementById("search-input").value.trim();
if (!raw)
return;
const match = raw.match(/(\d{1,4})$/);
if (!match) {
alert("请输入正确编号，如：31");
return;
}
const no = parseInt(match[1], 10);
const exists = state.data[state.currentBook].some(s => s.no === no);
if (!exists) {
alert("该编号不在当前册中");
return;
}
goToSong(state.currentBook, no);
}
document.addEventListener("DOMContentLoaded", async () => {
document.querySelectorAll(".search-book-btn").forEach(btn => {
btn.addEventListener("click", async () => {
const book = btn.dataset.book;
if (state.currentBook === book)
return;
if (state.loading)
return;
setActiveBook(book);
const listEl = document.getElementById("song-list");
if (!state.loaded[book]) {
listEl.innerHTML = '<li class="song-item"><span class="song-item-label">加载中，请稍候...</span></li>';
await loadAllRangesForBook(book);
}
renderList(book);
});
});
document.getElementById("btn-search").addEventListener("click", handleSearch);
document.getElementById("search-input").addEventListener("keydown", e => {
if (e.key === "Enter") {
e.preventDefault();
handleSearch();
}
});
await loadAllRangesForBook("c");
renderList("c");
loadAllRangesForBook("ts");
});