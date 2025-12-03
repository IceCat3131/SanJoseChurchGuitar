function setupSearchBar(){
  const searchInput=document.getElementById("global-search-no");
  const searchBtn=document.getElementById("global-search-btn");
  const bookSelector=document.getElementById("global-book-selector");
  function jump(){
    const no=parseInt(searchInput.value.trim(),10);
    const book=bookSelector.value;
    if(isNaN(no)||no<1||no>1000){alert("请输入 1~1000 编号");return;}
    location.href=`song.html?book=${book}&no=${no}`;
  }
  searchBtn.addEventListener("click",jump);
  searchInput.addEventListener("keydown",e=>{if(e.key==="Enter")jump();});
}
document.addEventListener("DOMContentLoaded",setupSearchBar);